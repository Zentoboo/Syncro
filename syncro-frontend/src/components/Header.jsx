// src/components/Header.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminOnly } from './RBACComponents';
import axios from 'axios';

const Header = ({ showUserManagement = false }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => location.pathname === path;

    const TriangleIcon = () => (
        <svg className="h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.42,21,17.58,12,6.42,3Z" />
        </svg>
    );

    // --- Enhanced Notification Bell Component ---
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
                navigate(`/project/${notification.projectId}/task/${notification.relatedTaskId}`);
            }
            setIsOpen(false);
        };

        // Helper function to get notification icon based on content
        const getNotificationIcon = (message) => {
            if (message.includes('mentioned you')) {
                return (
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v8a2 2 0 002 2h6a2 2 0 002-2V8M9 12h6" />
                        </svg>
                    </div>
                );
            } else if (message.includes('assigned you')) {
                return (
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </div>
                );
            } else if (message.includes('submitted') && message.includes('review')) {
                return (
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            } else if (message.includes('approved') || message.includes('requested changes')) {
                const isApproved = message.includes('approved');
                return (
                    <div className={`w-8 h-8 ${isApproved ? 'bg-emerald-500' : 'bg-yellow-500'} rounded-full flex items-center justify-center`}>
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {isApproved ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            )}
                        </svg>
                    </div>
                );
            } else {
                // Default notification icon
                return (
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            }
        };

        // Helper function to get notification category
        const getNotificationCategory = (message) => {
            if (message.includes('mentioned you')) return 'Mention';
            if (message.includes('assigned you')) return 'Assignment';
            if (message.includes('submitted') && message.includes('review')) return 'Review Request';
            if (message.includes('approved')) return 'Approved';
            if (message.includes('requested changes')) return 'Changes Requested';
            return 'General';
        };

        return (
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 rounded-full hover:bg-slate-700 transition-colors"
                >
                    <svg className="h-7 w-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 block h-6 w-6 rounded-full ring-2 ring-slate-800 bg-red-500 text-white text-sm flex items-center justify-center font-medium">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
                {isOpen && (
                    <div className="absolute right-0 mt-3 w-96 bg-slate-700 border border-slate-600 rounded-md shadow-lg overflow-hidden z-20">
                        <div className="py-2">
                            <div className="px-4 py-3 font-bold text-gray-100 flex items-center justify-between border-b border-slate-600">
                                <span className="flex items-center">
                                    <svg className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    Notifications
                                </span>
                                {unreadCount > 0 && (
                                    <span className="text-sm bg-red-500 text-white px-2 py-1 rounded-full font-normal">
                                        {unreadCount} unread
                                    </span>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`px-4 py-3 border-b border-slate-600 cursor-pointer transition-colors hover:bg-slate-600 ${!n.isRead ? 'bg-indigo-900 bg-opacity-30' : ''}`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            {/* Notification Icon */}
                                            {getNotificationIcon(n.message)}

                                            <div className="flex-1 min-w-0">
                                                {/* Notification Category Badge */}
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-medium text-indigo-300 bg-indigo-900 bg-opacity-50 px-2 py-0.5 rounded-full">
                                                        {getNotificationCategory(n.message)}
                                                    </span>
                                                    {!n.isRead && (
                                                        <div className="w-2 h-2 bg-indigo-400 rounded-full flex-shrink-0"></div>
                                                    )}
                                                </div>

                                                {/* Notification Message */}
                                                <p className="text-sm text-gray-200 leading-snug mb-2">
                                                    {n.message}
                                                </p>

                                                {/* Notification Footer */}
                                                <div className="flex items-center justify-between text-xs text-gray-400">
                                                    <span className="flex items-center">
                                                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        {n.triggeredByUsername}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                {/* Click to view indicator */}
                                                {n.relatedTaskId && (
                                                    <div className="mt-2 text-xs text-indigo-400 flex items-center">
                                                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                        </svg>
                                                        Click to view task
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="px-4 py-8 text-center">
                                        <svg className="h-12 w-12 text-slate-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        <p className="text-base text-gray-400 mb-1">No notifications yet</p>
                                        <p className="text-sm text-gray-500">You'll see task assignments, mentions, and updates here</p>
                                    </div>
                                )}
                            </div>
                            <div className="px-4 py-3 border-t border-slate-600 bg-slate-800">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        navigate('/notifications');
                                    }}
                                    className="w-full text-center text-base text-indigo-400 hover:text-indigo-300 font-medium py-2 hover:bg-indigo-900 bg-opacity-50 rounded transition-colors flex items-center justify-center"
                                >
                                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View All Notifications
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

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
                            <Link
                                to="/dashboard"
                                className={`px-4 py-2 rounded-md text-base font-medium ${isActive('/dashboard')
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                                    } transition-colors`}
                            >
                                Dashboard
                            </Link>

                            <AdminOnly>
                                <Link
                                    to="/user-management"
                                    className={`px-4 py-2 rounded-md text-base font-medium ${isActive('/user-management')
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                                        } transition-colors`}
                                >
                                    User Management
                                </Link>
                            </AdminOnly>

                            <Link
                                to="/about"
                                className={`px-4 py-2 rounded-md text-base font-medium ${isActive('/about')
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                                    } transition-colors`}
                            >
                                About
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center space-x-5">
                        <NotificationBell />
                        <span className="text-base text-gray-300">Welcome, {user?.username}</span>
                        <span className={`font-medium px-3 py-1 rounded-full text-sm ${user?.role === 'Admin'
                            ? 'bg-red-200 text-red-800'
                            : user?.role === 'ProjectManager'
                                ? 'bg-indigo-200 text-indigo-800'
                                : 'bg-green-200 text-green-800'
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