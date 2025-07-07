// zentoboo/syncro/Syncro-bc266b2d3b44722e8ff4501783c8d62f150e59ee/syncro-frontend/src/components/NotificationsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// Icons
const BellIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

const CheckIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const EyeIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const FilterIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
    </svg>
);

const Spinner = ({ size = 'h-5 w-5' }) => (
    <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 border-indigo-400`}></div>
);

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
    const [selectedNotifications, setSelectedNotifications] = useState(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/notification');
            setNotifications(response.data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Update page title for breadcrumb context
        document.title = 'Notifications - Syncro';
    }, []);

    const handleNotificationClick = async (notification) => {
        // Mark as read if not already read
        if (!notification.isRead) {
            try {
                await axios.post(`/api/notification/${notification.id}/mark-as-read`);
                setNotifications(prev => 
                    prev.map(n => 
                        n.id === notification.id ? { ...n, isRead: true } : n
                    )
                );
            } catch (error) {
                console.error('Failed to mark notification as read', error);
            }
        }

        // Navigate to related content if available
        if (notification.projectId && notification.relatedTaskId) {
            navigate(`/project/${notification.projectId}/tasks`);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await axios.post(`/api/notification/${notificationId}/mark-as-read`);
            setNotifications(prev => 
                prev.map(n => 
                    n.id === notificationId ? { ...n, isRead: true } : n
                )
            );
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const handleDeleteNotification = async (notificationId) => {
        if (window.confirm('Are you sure you want to delete this notification?')) {
            try {
                await axios.delete(`/api/notification/${notificationId}`);
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                setSelectedNotifications(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(notificationId);
                    return newSet;
                });
            } catch (error) {
                console.error('Failed to delete notification', error);
                alert('Failed to delete notification. This feature may not be implemented yet.');
            }
        }
    };

    const handleSelectNotification = (notificationId) => {
        setSelectedNotifications(prev => {
            const newSet = new Set(prev);
            if (newSet.has(notificationId)) {
                newSet.delete(notificationId);
            } else {
                newSet.add(notificationId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        const filteredNotifications = getFilteredNotifications();
        if (selectedNotifications.size === filteredNotifications.length) {
            setSelectedNotifications(new Set());
        } else {
            setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
        }
    };

    const handleBulkMarkAsRead = async () => {
        setBulkLoading(true);
        try {
            const promises = Array.from(selectedNotifications).map(id => 
                axios.post(`/api/notification/${id}/mark-as-read`)
            );
            await Promise.all(promises);
            
            setNotifications(prev => 
                prev.map(n => 
                    selectedNotifications.has(n.id) ? { ...n, isRead: true } : n
                )
            );
            setSelectedNotifications(new Set());
        } catch (error) {
            console.error('Failed to mark notifications as read', error);
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Are you sure you want to delete ${selectedNotifications.size} notifications?`)) {
            setBulkLoading(true);
            try {
                const promises = Array.from(selectedNotifications).map(id => 
                    axios.delete(`/api/notification/${id}`)
                );
                await Promise.all(promises);
                
                setNotifications(prev => 
                    prev.filter(n => !selectedNotifications.has(n.id))
                );
                setSelectedNotifications(new Set());
            } catch (error) {
                console.error('Failed to delete notifications', error);
                alert('Failed to delete notifications. This feature may not be implemented yet.');
            } finally {
                setBulkLoading(false);
            }
        }
    };

    const getFilteredNotifications = () => {
        switch (filter) {
            case 'unread':
                return notifications.filter(n => !n.isRead);
            case 'read':
                return notifications.filter(n => n.isRead);
            default:
                return notifications;
        }
    };

    const filteredNotifications = getFilteredNotifications();
    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Spinner size="h-12 w-12" />
                    <p className="mt-4 text-slate-400">Loading notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            {/* Header */}
            <header className="bg-slate-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-indigo-900 rounded-lg flex items-center justify-center">
                                <BellIcon />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">Notifications</h1>
                                <p className="text-slate-400 mt-1">
                                    Manage your notifications • {unreadCount} unread
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Filters and Actions */}
                <div className="bg-slate-800 rounded-lg shadow-lg mb-6 p-6 border border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        {/* Filters */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <FilterIcon />
                                <span className="text-sm font-medium text-slate-300">Filter:</span>
                            </div>
                            <div className="flex space-x-1">
                                {['all', 'unread', 'read'].map((filterType) => (
                                    <button
                                        key={filterType}
                                        onClick={() => setFilter(filterType)}
                                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                            filter === filterType
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                        }`}
                                    >
                                        {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                                        {filterType === 'unread' && unreadCount > 0 && (
                                            <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Bulk Actions */}
                        {selectedNotifications.size > 0 && (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-slate-400">
                                    {selectedNotifications.size} selected
                                </span>
                                <button
                                    onClick={handleBulkMarkAsRead}
                                    disabled={bulkLoading}
                                    className="inline-flex items-center px-3 py-1 text-sm bg-green-900 text-green-300 rounded-md hover:bg-green-800 disabled:opacity-50"
                                >
                                    <CheckIcon />
                                    <span className="ml-1">Mark Read</span>
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={bulkLoading}
                                    className="inline-flex items-center px-3 py-1 text-sm bg-red-900 text-red-300 rounded-md hover:bg-red-800 disabled:opacity-50"
                                >
                                    <TrashIcon />
                                    <span className="ml-1">Delete</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Select All */}
                    {filteredNotifications.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-700">
                            <button
                                onClick={handleSelectAll}
                                className="text-sm text-indigo-400 hover:text-indigo-300"
                            >
                                {selectedNotifications.size === filteredNotifications.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Notifications List */}
                <div className="space-y-4">
                    {filteredNotifications.length === 0 ? (
                        <div className="bg-slate-800 rounded-lg shadow-lg p-12 text-center border border-slate-700">
                            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-slate-700">
                                <BellIcon />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">
                                {filter === 'unread' ? 'No unread notifications' : 
                                 filter === 'read' ? 'No read notifications' : 'No notifications'}
                            </h3>
                            <p className="text-slate-400 mb-4">
                                {filter === 'all' ? "You're all caught up! New notifications will appear here." :
                                 filter === 'unread' ? "All notifications have been read." :
                                 "You haven't read any notifications yet."}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`bg-slate-800 rounded-lg shadow-lg transition-all duration-200 hover:shadow-indigo-500/10 ${
                                    !notification.isRead ? 'ring-2 ring-indigo-500' : 'border border-slate-700'
                                }`}
                            >
                                <div className="p-6">
                                    <div className="flex items-start space-x-4">
                                        {/* Selection Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={selectedNotifications.has(notification.id)}
                                            onChange={() => handleSelectNotification(notification.id)}
                                            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-600 rounded bg-slate-700"
                                        />

                                        {/* Status Indicator */}
                                        <div className="flex-shrink-0 mt-1">
                                            {!notification.isRead ? (
                                                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                                            ) : (
                                                <div className="w-3 h-3 bg-slate-600 rounded-full"></div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div 
                                            className="flex-1 cursor-pointer"
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className={`text-sm ${!notification.isRead ? 'font-medium text-white' : 'text-slate-300'}`}>
                                                    {notification.message}
                                                </p>
                                                <time className="text-xs text-slate-500">
                                                    {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                                                    {new Date(notification.createdAt).toLocaleTimeString([], { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })}
                                                </time>
                                            </div>
                                            
                                            <div className="mt-2 flex items-center space-x-4 text-xs text-slate-400">
                                                <span>From: {notification.triggeredByUsername}</span>
                                                {notification.projectId && (
                                                    <span className="px-2 py-1 bg-indigo-900 text-indigo-300 rounded-full">
                                                        Project Related
                                                    </span>
                                                )}
                                                {!notification.isRead && (
                                                    <span className="px-2 py-1 bg-red-900 text-red-300 rounded-full">
                                                        Unread
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center space-x-2">
                                            {!notification.isRead && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkAsRead(notification.id);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-900/50 rounded-md transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <EyeIcon />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteNotification(notification.id);
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/50 rounded-md transition-colors"
                                                title="Delete notification"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Load More / Pagination placeholder */}
                {filteredNotifications.length > 0 && (
                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500">
                            Showing {filteredNotifications.length} of {notifications.length} notifications
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;