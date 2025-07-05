// src/components/ProjectMembers.jsx - Complete updated version
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';

// Helper Components
const Spinner = ({ size = 'h-5 w-5' }) => (
    <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 border-blue-500`}></div>
);

const SearchIcon = () => (
    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const CrownIcon = () => (
    <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5 4a1 1 0 00-.707 1.707L8 9.414V17a1 1 0 001 1h2a1 1 0 001-1V9.414l3.707-3.707A1 1 0 0015 4H5z"/>
    </svg>
);

const UserIcon = () => (
    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const CheckIcon = () => (
    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const XIcon = () => (
    <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// Enhanced User Search Component
const UserSearch = ({ onAddMember, currentMembers, disabled = false }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState('Contributor');
    const [error, setError] = useState('');
    const [showResults, setShowResults] = useState(false);

    // Debounced search effect
    useEffect(() => {
        if (searchTerm.length < 2) {
            setSearchResults([]);
            setShowResults(false);
            setError('');
            return;
        }

        const delayedSearch = setTimeout(() => {
            searchUsers();
        }, 300);

        return () => clearTimeout(delayedSearch);
    }, [searchTerm]); // Only depend on searchTerm

    const searchUsers = async () => {
        setLoading(true);
        setError('');
        
        try {
            console.log('Searching for users with term:', searchTerm);
            
            const response = await axios.get(`/api/user/search?q=${encodeURIComponent(searchTerm)}`);
            
            console.log('Search response:', response.data);
            
            // Filter out users who are already members
            const currentMemberIds = currentMembers.map(m => m.user.id);
            const filteredResults = response.data.filter(user => !currentMemberIds.includes(user.id));
            
            setSearchResults(filteredResults);
            setShowResults(true);
            
            if (filteredResults.length === 0 && response.data.length > 0) {
                setError('All matching users are already project members');
            }
        } catch (error) {
            console.error('Error searching users:', error);
            
            if (error.response?.status === 403) {
                setError('You do not have permission to search for users');
            } else if (error.response?.status === 400) {
                setError('Search query must be at least 2 characters long');
            } else {
                setError('Failed to search users. Please try again.');
            }
            
            setSearchResults([]);
            setShowResults(false);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (user) => {
        try {
            console.log('Adding user:', user, 'with role:', selectedRole);
            
            setLoading(true);
            await onAddMember(user.username, selectedRole);
            
            // Clear search after successful addition
            setSearchTerm('');
            setSearchResults([]);
            setShowResults(false);
            setError('');
            
        } catch (error) {
            console.error('Error adding member:', error);
            setError('Failed to add member. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setError('');
        
        if (value.length < 2) {
            setShowResults(false);
        }
    };

    const handleInputFocus = () => {
        if (searchTerm.length >= 2 && searchResults.length > 0) {
            setShowResults(true);
        }
    };

    const handleInputBlur = () => {
        // Delay hiding results to allow clicking on them
        setTimeout(() => setShowResults(false), 200);
    };

    if (disabled) {
        return (
            <div className="bg-gray-50 rounded-lg shadow p-6 mb-6 border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                    <XIcon />
                    <p className="mt-2 text-sm">You don't have permission to add members to this project.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <SearchIcon />
                <span className="ml-2">Add New Member</span>
            </h3>
            
            <div className="space-y-4">
                <div className="flex space-x-4">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleInputChange}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            placeholder="Search users by username or email..."
                            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        {loading && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <Spinner size="h-4 w-4" />
                            </div>
                        )}
                    </div>
                    
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[150px]"
                    >
                        <option value="Contributor">Contributor</option>
                        <option value="ProjectManager">Project Manager</option>
                    </select>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
                        <XIcon />
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Search Instructions */}
                {searchTerm.length > 0 && searchTerm.length < 2 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start space-x-2">
                        <svg className="h-4 w-4 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-blue-600">Type at least 2 characters to search for users</p>
                    </div>
                )}

                {/* Search Results */}
                {showResults && searchTerm.length >= 2 && (
                    <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto bg-white shadow-lg">
                        {loading ? (
                            <div className="p-4 text-center">
                                <Spinner />
                                <p className="text-sm text-gray-500 mt-2">Searching...</p>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {searchResults.map((user) => (
                                    <div key={user.id} className="p-3 hover:bg-gray-50 flex items-center justify-between transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{user.username}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                                <p className="text-xs text-gray-400">Global role: {user.role}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAddUser(user)}
                                            disabled={loading}
                                            className="ml-3 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {loading ? <Spinner size="h-3 w-3" /> : 'Add'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-100">
                                    <UserIcon />
                                </div>
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                    No users found
                                </p>
                                <p className="text-sm text-gray-500 mb-1">
                                    No users match "{searchTerm}"
                                </p>
                                <p className="text-xs text-gray-400">
                                    Try searching with a different username or email
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Member Card Component
const MemberCard = ({ member, isOwner, currentUser, userRole, onRemoveMember, onUpdateRole, isCurrentUserProjectOwner }) => {
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);
    const isSelf = member.user.id === currentUser.id;
    
    // Updated permission logic - Project owner can kick anyone except themselves
    const canRemove = (userRole === 'Admin' && !isSelf) || (isCurrentUserProjectOwner && !isSelf);
    const canChangeRole = userRole === 'Admin' && !isSelf;

    const getRoleBadgeStyle = (role) => {
        switch (role) {
            case 'Admin':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'ProjectManager':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Contributor':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handleRoleChange = async (newRole) => {
        if (newRole === member.role) return;
        
        setIsUpdatingRole(true);
        try {
            await onUpdateRole(member.id, newRole);
        } finally {
            setIsUpdatingRole(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold relative">
                        {member.user.username.charAt(0).toUpperCase()}
                        {isOwner && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                <CrownIcon />
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            {member.user.username}
                            {isOwner && <span className="ml-2 text-sm text-yellow-600 font-medium">(Project Owner)</span>}
                            {isSelf && <span className="ml-2 text-sm text-gray-500">(You)</span>}
                        </h3>
                        <p className="text-sm text-gray-500">{member.user.email}</p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center">
                            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeStyle(member.role)}`}>
                        {member.role}
                    </span>

                    {canChangeRole && (
                        <div className="relative">
                            <select
                                value={member.role}
                                onChange={(e) => handleRoleChange(e.target.value)}
                                disabled={isUpdatingRole}
                                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed min-w-[130px]"
                            >
                                <option value="Contributor">Contributor</option>
                                <option value="ProjectManager">Project Manager</option>
                                <option value="Admin">Admin</option>
                            </select>
                            {isUpdatingRole && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                    <Spinner size="h-3 w-3" />
                                </div>
                            )}
                        </div>
                    )}

                    {canRemove && (
                        <button
                            onClick={() => onRemoveMember(member.id, member.user.username)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded-md border border-red-200 hover:bg-red-50 transition-colors flex items-center space-x-1"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 0v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>{isCurrentUserProjectOwner ? 'Kick from Project' : 'Remove'}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Main Component
const ProjectMembers = () => {
    const { projectId } = useParams();
    const { user } = useAuth();
    const { updateProjectInfo } = useBreadcrumb();
    const [project, setProject] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const userRoleInProject = members.find(m => m.user.id === user.id)?.role;
    const isProjectOwner = project?.createdBy?.id === user.id;
    const canManageMembers = userRoleInProject === 'Admin' || userRoleInProject === 'ProjectManager' || isProjectOwner;

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`/api/project/${projectId}`);
            setProject(response.data);
            setMembers(response.data.members || []);

            // Update breadcrumb context
            updateProjectInfo(projectId, response.data.name);
        } catch (err) {
            setError('Failed to fetch project data. You may not have access to this project.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [projectId]); // Remove updateProjectInfo from dependencies

    useEffect(() => {
        fetchData();
    }, [projectId]); // Only depend on projectId, not fetchData

    // Clear success message after 5 seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const handleAddMember = async (username, role) => {
        try {
            await axios.post(`/api/project/${projectId}/members`, { username, role });
            // Refresh data without using fetchData callback
            const response = await axios.get(`/api/project/${projectId}`);
            setProject(response.data);
            setMembers(response.data.members || []);
            setSuccessMessage(`${username} has been added to the project as ${role}`);
        } catch (error) {
            const errorMessage = error.response?.data || 'Failed to add member';
            setError(errorMessage);
            setTimeout(() => setError(''), 5000);
            throw error;
        }
    };

    const handleRemoveMember = async (memberId, username) => {
        const kickMessage = isProjectOwner 
            ? `Are you sure you want to kick ${username} from this project? They will lose access to the project, but all their past contributions (tasks, comments, files) will remain intact.`
            : `Are you sure you want to remove ${username} from this project? Their contributions will remain, but they will lose access to the project.`;
        
        if (window.confirm(kickMessage)) {
            try {
                await axios.delete(`/api/project/${projectId}/members/${memberId}`);
                // Refresh data without using fetchData callback
                const response = await axios.get(`/api/project/${projectId}`);
                setProject(response.data);
                setMembers(response.data.members || []);
                
                const successMessage = isProjectOwner 
                    ? `${username} has been kicked from the project`
                    : `${username} has been removed from the project`;
                setSuccessMessage(successMessage);
            } catch (error) {
                const errorMessage = isProjectOwner 
                    ? 'Failed to kick member from project'
                    : 'Failed to remove member';
                setError(errorMessage);
                setTimeout(() => setError(''), 5000);
            }
        }
    };

    const handleUpdateRole = async (memberId, newRole) => {
        try {
            await axios.put(`/api/project/${projectId}/members/${memberId}`, { role: newRole });
            // Refresh data without using fetchData callback
            const response = await axios.get(`/api/project/${projectId}`);
            setProject(response.data);
            setMembers(response.data.members || []);
            setSuccessMessage(`Member role updated successfully`);
        } catch (error) {
            setError('Failed to update member role');
            setTimeout(() => setError(''), 5000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Spinner size="h-12 w-12" />
                    <p className="mt-4 text-gray-600">Loading project members...</p>
                </div>
            </div>
        );
    }

    if (error && !project) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-100">
                        <XIcon />
                    </div>
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Error Loading Project</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Project not found.</p>
                    <Link
                        to="/dashboard"
                        className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Project Members</h1>
                            <p className="text-gray-600 mt-1">{project.name}</p>
                            <p className="text-sm text-gray-500">
                                Manage team members and their permissions
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Removed buttons as requested */}
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-start space-x-2">
                        <CheckIcon />
                        <p className="text-sm text-green-600">{successMessage}</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
                        <XIcon />
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Add Member Section */}
                <UserSearch
                    onAddMember={handleAddMember}
                    currentMembers={members}
                    disabled={!canManageMembers}
                />

                {/* Members List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Team Members ({members.length})
                        </h2>
                        <div className="text-sm text-gray-500">
                            {isProjectOwner ? 'You are the project owner' : `Your role: ${userRoleInProject}`}
                        </div>
                    </div>

                    {members.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
                            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-100">
                                <UserIcon />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No team members</h3>
                            <p className="text-gray-500 mb-4">Get started by adding team members to your project.</p>
                            {canManageMembers && (
                                <p className="text-sm text-blue-600">Use the search box above to find and add users.</p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {members
                                .sort((a, b) => {
                                    // Sort: Owner first, then by role, then by name
                                    if (a.user.id === project.createdBy?.id) return -1;
                                    if (b.user.id === project.createdBy?.id) return 1;
                                    if (a.role !== b.role) {
                                        const roleOrder = { 'Admin': 0, 'ProjectManager': 1, 'Contributor': 2 };
                                        return roleOrder[a.role] - roleOrder[b.role];
                                    }
                                    return a.user.username.localeCompare(b.user.username);
                                })
                                .map((member) => (
                                    <MemberCard
                                        key={member.id}
                                        member={member}
                                        isOwner={member.user.id === project.createdBy?.id}
                                        currentUser={user}
                                        userRole={userRoleInProject}
                                        onRemoveMember={handleRemoveMember}
                                        onUpdateRole={handleUpdateRole}
                                        isCurrentUserProjectOwner={isProjectOwner}
                                    />
                                ))
                            }
                        </div>
                    )}
                </div>

                {/* Permission Info */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-6">
                    <h3 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Permission Information
                    </h3>
                    <div className="text-sm text-blue-700 space-y-2">
                        <div className="flex items-start space-x-2">
                            <CrownIcon />
                            <p><strong>Project Owner:</strong> Can manage all members, kick users from the project, and has full project control</p>
                        </div>
                        <p><strong>Admin:</strong> Can add/remove members, change roles, and manage all project aspects</p>
                        <p><strong>Project Manager:</strong> Can add members, create/assign tasks, and manage project workflow</p>
                        <p><strong>Contributor:</strong> Can work on assigned tasks and participate in project activities</p>
                        <div className="mt-3 p-3 bg-blue-100 rounded-md">
                            <p className="text-xs text-blue-800">
                                <strong>Note:</strong> When a user is kicked or removed from a project, their past contributions (completed tasks, comments, and uploaded files) remain in the project for continuity.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h4 className="text-lg font-semibold text-gray-900">{members.length}</h4>
                                <p className="text-sm text-gray-500">Total Members</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h4 className="text-lg font-semibold text-gray-900">
                                    {members.filter(m => m.role === 'Admin' || m.role === 'ProjectManager').length}
                                </h4>
                                <p className="text-sm text-gray-500">Managers</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h4 className="text-lg font-semibold text-gray-900">
                                    {members.filter(m => m.role === 'Contributor').length}
                                </h4>
                                <p className="text-sm text-gray-500">Contributors</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectMembers;