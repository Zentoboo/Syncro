// src/components/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRBAC } from '../hooks/useRBAC';
import { AdminOnly } from './RBACComponents';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState({});
    const { canPromoteUser, canDeleteUser } = useRBAC();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300); // 300ms debounce
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    useEffect(() => {
        fetchUsers(debouncedSearch);
    }, [debouncedSearch]);

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

    const updateUserRole = async (userId, newRole) => {
        if (!canPromoteUser()) {
            alert('You do not have permission to change user roles');
            return;
        }

        try {
            setUpdating(prev => ({ ...prev, [userId]: true }));

            // You'll need to create this endpoint in your backend
            await axios.put(`/api/admin/users/${userId}/role`, { role: newRole });

            // Update local state
            setUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
            ));

            alert('User role updated successfully');
        } catch (error) {
            console.error('Error updating user role:', error);
            alert('Failed to update user role');
        } finally {
            setUpdating(prev => ({ ...prev, [userId]: false }));
        }
    };
    const deleteUser = async (userId) => {
        if (!canDeleteUser()) { // Check if the current user has permission to delete
            alert('You do not have permission to delete users');
            return;
        }

        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                setUpdating(prev => ({ ...prev, [userId]: true }));
                // You'll need to create this endpoint in your backend (e.g., DELETE /api/admin/users/:userId)
                await axios.delete(`/api/admin/users/${userId}`);

                // Remove the user from the local state
                setUsers(prev => prev.filter(user => user.id !== userId));

                alert('User deleted successfully');
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Failed to delete user');
            } finally {
                setUpdating(prev => ({ ...prev, [userId]: false }));
            }
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'Admin':
                return 'bg-red-100 text-red-800';
            case 'ProjectManager':
                return 'bg-blue-100 text-blue-800';
            case 'Contributor':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <AdminOnly fallback={
            <div className="text-center py-8">
                <p className="text-gray-500">You do not have permission to access user management.</p>
            </div>
        }>
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-6">User Management</h2>
                    <input
                        type="text"
                        placeholder="Search by username..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border border-gray-300 rounded px-4 py-2 w-full md:w-1/3 mb-4"
                    />

                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Current Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.username}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                {user.role !== 'Admin' && (
                                                    <button
                                                        onClick={() => updateUserRole(user.id, 'Admin')}
                                                        disabled={updating[user.id]}
                                                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                    >
                                                        Make Admin
                                                    </button>
                                                )}
                                                {user.role !== 'ProjectManager' && (
                                                    <button
                                                        onClick={() => updateUserRole(user.id, 'ProjectManager')}
                                                        disabled={updating[user.id]}
                                                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                                                    >
                                                        Make PM
                                                    </button>
                                                )}
                                                {user.role !== 'Contributor' && (
                                                    <button
                                                        onClick={() => updateUserRole(user.id, 'Contributor')}
                                                        disabled={updating[user.id]}
                                                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                                    >
                                                        Make Contributor
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteUser(user.id)}
                                                    disabled={updating[user.id]}
                                                    className="text-gray-500 hover:text-black disabled:opacity-50"
                                                >
                                                    Delete
                                                </button>

                                                {updating[user.id] && (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminOnly>
    );
};

export default UserManagement;