// src/components/Header.jsx - Updated with built-in NotificationBell
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminOnly } from './RBACComponents';
import axios from 'axios';

const Header = ({
    activeTab,
    setActiveTab,
    showUserManagement = false
}) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Triangle Icon Component
    const TriangleIcon = () => (
        <svg className="h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.42,21,17.58,12,6.42,3Z" />
        </svg>
    );

    // --- Notification Bell Component (moved into Header) ---
    const NotificationBell = () => {
        const [notifications, setNotifications] = useState([]);
        const [unreadCount, setUnreadCount] = useState(0);
        const [isOpen, setIsOpen] = useState(false);

        const fetchNotifications = useCallback(async () => {
            try {
                const notificationsResponse = await axios.get('/api/notification');
                setNotifications(notificationsResponse.data.slice(0, 10));
                setUnreadCount(notificationsResponse.data.filter(n => !n.isRead).length);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        }, []);

        useEffect(() => {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }, [fetchNotifications]);

        const handleNotificationClick = async (notification) => {
            if (!notification.isRead) {
                try {
                    await axios.post(`/api/notification/${notification.id}/mark-as-read`);
                    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
                    setUnreadCount(prev => Math.max(0, prev - 1));
                } catch (error) {
                    console.error("Failed to mark notification as read", error);
                }
            }
            if (notification.projectId && notification.relatedTaskId) {
                navigate(`/project/${notification.projectId}/tasks`);
            }
            setIsOpen(false);
        };

        return (
            <div className="relative">
                <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full hover:bg-slate-700">
                    <svg className="h-7 w-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 block h-6 w-6 rounded-full ring-2 ring-slate-800 bg-red-500 text-white text-sm flex items-center justify-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
                {isOpen && (
                    <div className="absolute right-0 mt-3 w-96 bg-slate-700 border border-slate-600 rounded-md shadow-lg overflow-hidden z-20">
                        <div className="py-2">
                            <div className="px-4 py-2 font-bold text-gray-100 flex items-center justify-between">
                                <span>Notifications</span>
                                {unreadCount > 0 && (
                                    <span className="text-sm bg-red-200 text-red-800 px-2 py-1 rounded-full">
                                        {unreadCount} unread
                                    </span>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`px-4 py-3 border-b border-slate-600 cursor-pointer ${!n.isRead ? 'bg-indigo-900 bg-opacity-50' : 'hover:bg-slate-600'}`}
                                    >
                                        <div className="flex items-start">
                                            {!n.isRead && (
                                                <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                            )}
                                            <div className="flex-1">
                                                <p className="text-base text-gray-200">{n.message}</p>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    {new Date(n.createdAt).toLocaleString()} • {n.triggeredByUsername}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="px-4 py-4 text-base text-gray-400">No new notifications.</div>
                                )}
                            </div>
                            <div className="px-4 py-2 border-t border-slate-600 bg-slate-800">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        navigate('/notifications');
                                    }}
                                    className="w-full text-center text-base text-indigo-400 hover:text-indigo-300 font-medium py-2 hover:bg-indigo-900 bg-opacity-50 rounded transition-colors"
                                >
                                    View All Notifications →
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Determine if we're on specific pages
    const isOnDashboard = location.pathname === '/dashboard';
    const isOnAbout = location.pathname === '/about';

    return (
        <header className="bg-slate-800 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    <div className="flex items-center space-x-8">
                        <div className="flex items-center space-x-2">
                            <TriangleIcon />
                            <h1 className="text-3xl font-bold text-white">Syncro</h1>
                        </div>
                        <nav className="flex space-x-4">
                            {/* Dashboard Navigation */}
                            {isOnDashboard ? (
                                <>
                                    <button
                                        onClick={() => setActiveTab('dashboard')}
                                        className={`px-4 py-2 rounded-md text-base font-medium ${activeTab === 'dashboard'
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                                            } transition-colors`}
                                    >
                                        Dashboard
                                    </button>
                                    {showUserManagement && (
                                        <AdminOnly>
                                            <button
                                                onClick={() => setActiveTab('users')}
                                                className={`px-4 py-2 rounded-md text-base font-medium ${activeTab === 'users'
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                                                    } transition-colors`}
                                            >
                                                User Management
                                            </button>
                                        </AdminOnly>
                                    )}
                                </>
                            ) : (
                                /* Other pages navigation */
                                <>
                                    <Link
                                        to="/dashboard"
                                        className={`px-4 py-2 rounded-md text-base font-medium ${isOnDashboard
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                                            } transition-colors`}
                                    >
                                        Dashboard
                                    </Link>
                                </>
                            )}

                            {/* About Navigation */}
                            {isOnAbout ? (
                                <span className="px-4 py-2 rounded-md text-base font-medium bg-indigo-600 text-white">
                                    About
                                </span>
                            ) : (
                                <Link
                                    to="/about"
                                    className="px-4 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                                >
                                    About
                                </Link>
                            )}
                        </nav>
                    </div>

                    <div className="flex items-center space-x-5">
                        {/* Notification Bell - now always visible */}
                        <NotificationBell />

                        <span className="text-base text-gray-300">Welcome, {user?.username}</span>
                        <span className={`font-medium px-3 py-1 rounded-full text-sm ${user?.role === 'Admin' ? 'bg-red-200 text-red-800' :
                                user?.role === 'ProjectManager' ? 'bg-indigo-200 text-indigo-800' :
                                    'bg-green-200 text-green-800'
                            }`}>
                            {user?.role}
                        </span>
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;