// src/components/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRBAC } from '../hooks/useRBAC';
import { AdminOnly } from './RBACComponents';
import Header from './Header'; // Import the shared Header

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState({});
    const { canPromoteUser } = useRBAC();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statistics, setStatistics] = useState(null);

    // Section Icon Component  
    const SectionIcon = () => (
        <div className="w-4 h-4 bg-indigo-500 rounded-sm mr-3 flex-shrink-0"></div>
    );

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300); // 300ms debounce
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    useEffect(() => {
        fetchUsers(debouncedSearch);
    }, [debouncedSearch]);

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchUsers = async (search = '') => {
        try {
            setLoading(true);
            const response = await axios.get('/api/admin/users', {
                params: { search }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await axios.get('/api/admin/statistics');
            setStatistics(response.data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    const updateUserRole = async (userId, newRole) => {
        if (!canPromoteUser()) {
            alert('You do not have permission to change user roles');
            return;
        }

        try {
            setUpdating(prev => ({ ...prev, [userId]: true }));

            await axios.put(`/api/admin/users/${userId}/role`, { role: newRole });

            // Update local state
            setUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
            ));

            alert('User role updated successfully');
            // Refresh statistics after role change
            fetchStatistics();
        } catch (error) {
            console.error('Error updating user role:', error);
            alert(error.response?.data || 'Failed to update user role');
        } finally {
            setUpdating(prev => ({ ...prev, [userId]: false }));
        }
    };

    const banUser = async (userId, username) => {
        if (window.confirm(`Are you sure you want to ban user "${username}"? They will no longer be able to access the system.`)) {
            try {
                setUpdating(prev => ({ ...prev, [userId]: true }));
                await axios.put(`/api/admin/users/${userId}/ban`);

                // Update local state
                setUsers(prev => prev.map(user =>
                    user.id === userId ? { ...user, isActive: false } : user
                ));

                alert(`User "${username}" has been banned successfully`);
                // Refresh statistics after ban
                fetchStatistics();
            } catch (error) {
                console.error('Error banning user:', error);
                alert(error.response?.data || 'Failed to ban user');
            } finally {
                setUpdating(prev => ({ ...prev, [userId]: false }));
            }
        }
    };

    const unbanUser = async (userId, username) => {
        if (window.confirm(`Are you sure you want to unban user "${username}"? They will regain access to the system.`)) {
            try {
                setUpdating(prev => ({ ...prev, [userId]: true }));
                await axios.put(`/api/admin/users/${userId}/unban`);

                // Update local state
                setUsers(prev => prev.map(user =>
                    user.id === userId ? { ...user, isActive: true } : user
                ));

                alert(`User "${username}" has been unbanned successfully`);
                // Refresh statistics after unban
                fetchStatistics();
            } catch (error) {
                console.error('Error unbanning user:', error);
                alert(error.response?.data || 'Failed to unban user');
            } finally {
                setUpdating(prev => ({ ...prev, [userId]: false }));
            }
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'Admin':
                return 'bg-red-900 text-red-200 border border-red-700';
            case 'ProjectManager':
                return 'bg-indigo-900 text-indigo-200 border border-indigo-700';
            case 'Contributor':
                return 'bg-green-900 text-green-200 border border-green-700';
            default:
                return 'bg-slate-700 text-slate-200 border border-slate-600';
        }
    };

    const getStatusBadgeColor = (isActive) => {
        return isActive
            ? 'bg-green-900 text-green-200 border border-green-700'
            : 'bg-red-900 text-red-200 border border-red-700';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 text-white">
                {/* Use the shared Header component */}
                <Header />
                
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-400 mx-auto"></div>
                        <p className="mt-4 text-slate-400">Loading user management...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            {/* Use the shared Header component */}
            <Header />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminOnly fallback={
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-900 bg-opacity-50">
                            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-medium text-white mb-2">Access Denied</h2>
                        <p className="text-slate-400">You do not have permission to access user management.</p>
                    </div>
                }>
                    <div className="bg-slate-800 shadow-xl rounded-lg border border-slate-700">
                        <div className="px-4 py-5 sm:p-6">
                            {/* Header with Statistics */}
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                                    <SectionIcon />
                                    User Management
                                </h2>

                                {/* Statistics Cards */}
                                {statistics && (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 hover:border-indigo-500 transition-colors">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="w-12 h-12 bg-indigo-900 rounded-lg flex items-center justify-center">
                                                        <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-indigo-300">Total Users</p>
                                                    <p className="text-2xl font-bold text-white">{statistics.totalUsers}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 hover:border-green-500 transition-colors">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="w-12 h-12 bg-green-900 rounded-lg flex items-center justify-center">
                                                        <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-green-300">Active Users</p>
                                                    <p className="text-2xl font-bold text-white">{statistics.activeUsers}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 hover:border-red-500 transition-colors">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="w-12 h-12 bg-red-900 rounded-lg flex items-center justify-center">
                                                        <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-red-300">Banned Users</p>
                                                    <p className="text-2xl font-bold text-white">{statistics.bannedUsers}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 hover:border-purple-500 transition-colors">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="w-12 h-12 bg-purple-900 rounded-lg flex items-center justify-center">
                                                        <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-purple-300">Total Projects</p>
                                                    <p className="text-2xl font-bold text-white">{statistics.totalProjects}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Search Input */}
                            <div className="mb-6">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by username or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                                {searchTerm && (
                                    <p className="mt-2 text-sm text-slate-400">
                                        {users.length > 0 ? `Found ${users.length} user(s)` : 'No users found'}
                                        {searchTerm && ` matching "${searchTerm}"`}
                                    </p>
                                )}
                            </div>

                            {/* Users Table */}
                            <div className="overflow-hidden shadow-xl border border-slate-700 rounded-lg">
                                <table className="min-w-full divide-y divide-slate-700">
                                    <thead className="bg-slate-700">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                                User Info
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-slate-800 divide-y divide-slate-700">
                                        {users.map((user) => (
                                            <tr key={user.id} className={`hover:bg-slate-700 transition-colors ${!user.isActive ? 'bg-red-900 bg-opacity-20' : ''}`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-12 w-12">
                                                            <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center">
                                                                <span className="text-lg font-medium text-white">
                                                                    {user.username.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-white">
                                                                {user.username}
                                                            </div>
                                                            <div className="text-sm text-slate-400">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.isActive)}`}>
                                                        {user.isActive ? 'Active' : 'Banned'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center space-x-3">
                                                        {/* Role Change Actions - Only for non-Admin users */}
                                                        {user.role !== 'Admin' && (
                                                            <>
                                                                {user.role !== 'ProjectManager' && (
                                                                    <button
                                                                        onClick={() => updateUserRole(user.id, 'ProjectManager')}
                                                                        disabled={updating[user.id]}
                                                                        className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                        title="Promote to Project Manager"
                                                                    >
                                                                        Make PM
                                                                    </button>
                                                                )}
                                                                {user.role !== 'Contributor' && (
                                                                    <button
                                                                        onClick={() => updateUserRole(user.id, 'Contributor')}
                                                                        disabled={updating[user.id]}
                                                                        className="text-green-400 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                        title="Demote to Contributor"
                                                                    >
                                                                        Make Contributor
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* Ban/Unban Actions - Only for non-Admin users */}
                                                        {user.role !== 'Admin' && (
                                                            user.isActive ? (
                                                                <button
                                                                    onClick={() => banUser(user.id, user.username)}
                                                                    disabled={updating[user.id]}
                                                                    className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                    title="Ban user"
                                                                >
                                                                    Ban User
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => unbanUser(user.id, user.username)}
                                                                    disabled={updating[user.id]}
                                                                    className="text-green-400 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                    title="Unban user"
                                                                >
                                                                    Unban User
                                                                </button>
                                                            )
                                                        )}

                                                        {/* Loading Indicator */}
                                                        {updating[user.id] && (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
                                                        )}

                                                        {/* Show protected status for admins */}
                                                        {user.role === 'Admin' && (
                                                            <span className="text-xs text-slate-500 italic">Protected</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Empty State */}
                                {users.length === 0 && !loading && (
                                    <div className="text-center py-12 bg-slate-800">
                                        <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        <h3 className="mt-2 text-lg font-medium text-white">No users found</h3>
                                        <p className="mt-1 text-sm text-slate-400">
                                            {searchTerm ? `No users match "${searchTerm}"` : 'Try adjusting your search criteria'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Help Text */}
                            <div className="mt-6 p-6 bg-slate-700 border border-slate-600 rounded-lg">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-indigo-300">User Management Guidelines</h3>
                                        <div className="mt-2 text-sm text-slate-300">
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li><strong className="text-indigo-300">Project Manager:</strong> Can create projects and manage project members</li>
                                                <li><strong className="text-indigo-300">Contributor:</strong> Can participate in projects and work on assigned tasks</li>
                                                <li><strong className="text-indigo-300">Admin users:</strong> Cannot have their roles changed or be banned (protected accounts)</li>
                                                <li><strong className="text-indigo-300">Banned users:</strong> Cannot log in or access the system until unbanned</li>
                                                <li><strong className="text-indigo-300">Search:</strong> You can search by username or email address to quickly find users</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </AdminOnly>
            </main>
        </div>
    );
};

export default UserManagement;