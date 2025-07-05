// src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useNotifications = (options = {}) => {
    const { 
        limit = null, 
        autoRefresh = true, 
        refreshInterval = 30000, // 30 seconds
        isRead = null 
    } = options;

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchNotifications = useCallback(async () => {
        try {
            setError(null);
            const params = new URLSearchParams();
            
            if (limit !== null) params.append('limit', limit);
            if (isRead !== null) params.append('isRead', isRead);
            
            const queryString = params.toString();
            const url = `/api/notification${queryString ? `?${queryString}` : ''}`;
            
            const response = await axios.get(url);
            setNotifications(response.data);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            setError(err.response?.data || err.message || 'Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    }, [limit, isRead]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Auto-refresh notifications
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(fetchNotifications, refreshInterval);
        return () => clearInterval(interval);
    }, [fetchNotifications, autoRefresh, refreshInterval]);

    const markAsRead = useCallback(async (notificationId) => {
        try {
            await axios.post(`/api/notification/${notificationId}/mark-as-read`);
            setNotifications(prev => 
                prev.map(n => 
                    n.id === notificationId ? { ...n, isRead: true } : n
                )
            );
            return { success: true };
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
            return { success: false, error: err.response?.data || err.message };
        }
    }, []);

    const deleteNotification = useCallback(async (notificationId) => {
        try {
            await axios.delete(`/api/notification/${notificationId}`);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            return { success: true };
        } catch (err) {
            console.error('Failed to delete notification:', err);
            return { success: false, error: err.response?.data || err.message };
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await axios.post('/api/notification/mark-all-as-read');
            setNotifications(prev => 
                prev.map(n => ({ ...n, isRead: true }))
            );
            return { success: true };
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
            return { success: false, error: err.response?.data || err.message };
        }
    }, []);

    const bulkMarkAsRead = useCallback(async (notificationIds) => {
        try {
            await axios.post('/api/notification/bulk/mark-as-read', { notificationIds });
            setNotifications(prev => 
                prev.map(n => 
                    notificationIds.includes(n.id) ? { ...n, isRead: true } : n
                )
            );
            return { success: true };
        } catch (err) {
            console.error('Failed to bulk mark notifications as read:', err);
            return { success: false, error: err.response?.data || err.message };
        }
    }, []);

    const bulkDelete = useCallback(async (notificationIds) => {
        try {
            await axios.delete('/api/notification/bulk', { 
                data: { notificationIds } 
            });
            setNotifications(prev => 
                prev.filter(n => !notificationIds.includes(n.id))
            );
            return { success: true };
        } catch (err) {
            console.error('Failed to bulk delete notifications:', err);
            return { success: false, error: err.response?.data || err.message };
        }
    }, []);

    // Computed values
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const readCount = notifications.filter(n => n.isRead).length;
    const totalCount = notifications.length;

    const stats = {
        total: totalCount,
        unread: unreadCount,
        read: readCount
    };

    return {
        notifications,
        loading,
        error,
        stats,
        actions: {
            refresh: fetchNotifications,
            markAsRead,
            deleteNotification,
            markAllAsRead,
            bulkMarkAsRead,
            bulkDelete
        }
    };
};

// Specific hook for bell notifications (limited to recent unread)
export const useBellNotifications = () => {
    return useNotifications({
        limit: 5,
        autoRefresh: true,
        refreshInterval: 30000
    });
};

// Hook for the full notifications page
export const useNotificationsPage = (filter = 'all') => {
    const isRead = filter === 'all' ? null : filter === 'read';
    
    return useNotifications({
        limit: 50,
        autoRefresh: false,
        isRead
    });
};