import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';

// Helper Components
const Spinner = ({ size = 'h-5 w-5' }) => (
    <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 border-indigo-400`}></div>
);

const SearchIcon = () => (
    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const CrownIcon = () => (
    <svg className="h-4 w-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5 4a1 1 0 00-.707 1.707L8 9.414V17a1 1 0 001 1h2a1 1 0 001-1V9.414l3.707-3.707A1 1 0 0015 4H5z" />
    </svg>
);

const UserIcon = () => (
    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const CheckIcon = () => (
    <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const XIcon = () => (
    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// Enhanced User Search Component with Role-based filtering
const UserSearch = ({ onAddMember, currentMembers, disabled = false }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState('Contributor');
    const [error, setError] = useState('');
    const [showResults, setShowResults] = useState(false);

    // Stable search function
    const searchUsers = useCallback(async () => {
        if (searchTerm.length < 2) return;
        
        setLoading(true);
        setError('');

        try {
            const response = await axios.get(`/api/project/search-users?q=${encodeURIComponent(searchTerm)}`);

            // Filter out users who are already members
            const currentMemberIds = currentMembers.map(m => m.user.id);
            let filteredResults = response.data.filter(user => !currentMemberIds.includes(user.id));

            // ROLE-BASED FILTERING: Only show users whose global role matches selected project role
            // EXCLUDE ADMINS: Admins cannot be invited to projects
            filteredResults = filteredResults.filter(user => {
                // Never show Admins in search results
                if (user.role === 'Admin') {
                    return false;
                }
                
                // Only show users whose global role exactly matches the selected project role
                if (selectedRole === 'Contributor') {
                    return user.role === 'Contributor';
                } else if (selectedRole === 'ProjectManager') {
                    return user.role === 'ProjectManager';
                }
                return false;
            });

            setSearchResults(filteredResults);
            setShowResults(true);

            if (filteredResults.length === 0 && response.data.length > 0) {
                const roleMessage = selectedRole === 'Contributor' 
                    ? 'No Contributors found' 
                    : 'No Project Managers found';
                setError(roleMessage + ' (Admins cannot be invited to projects)');
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
    }, [searchTerm, selectedRole, currentMembers]);

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
    }, [searchUsers]);

    const handleAddUser = async (user) => {
        try {
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

    const handleRoleChange = (e) => {
        setSelectedRole(e.target.value);
        setError('');
        // Clear results when role changes - new search will be triggered by useEffect
        if (searchTerm.length >= 2) {
            setSearchResults([]);
        }
    };

    const handleInputFocus = () => {
        if (searchTerm.length >= 2 && searchResults.length > 0) {
            setShowResults(true);
        }
    };

    const handleInputBlur = () => {
        setTimeout(() => setShowResults(false), 200);
    };

    if (disabled) {
        return (
            <div className="bg-slate-800 rounded-lg shadow-lg p-6 mb-6 border-2 border-dashed border-slate-700">
                <div className="text-center text-slate-500">
                    <XIcon />
                    <p className="mt-2 text-sm">You don't have permission to add members to this project.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 rounded-lg shadow-lg p-6 mb-6 border border-slate-700">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
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
                            placeholder={`Search for ${selectedRole === 'Contributor' ? 'Contributors' : 'Project Managers'}...`}
                            className="block w-full pl-10 pr-10 py-2 border border-slate-600 rounded-md leading-5 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                        {loading && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <Spinner size="h-4 w-4" />
                            </div>
                        )}
                    </div>

                    <select
                        value={selectedRole}
                        onChange={handleRoleChange}
                        className="px-3 py-2 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-700 text-white min-w-[150px]"
                    >
                        <option value="Contributor">Contributor</option>
                        <option value="ProjectManager">Project Manager</option>
                    </select>
                </div>

                {/* Role Info */}
                <div className="p-3 bg-indigo-900 bg-opacity-30 border border-indigo-700 rounded-md">
                    <p className="text-sm text-indigo-300">
                        Only showing {selectedRole === 'Contributor' ? 'Contributors' : 'Project Managers'}. 
                        Admins cannot be invited to projects.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-900 bg-opacity-50 border border-red-700 rounded-md flex items-start space-x-2">
                        <XIcon />
                        <p className="text-sm text-red-300">{error}</p>
                    </div>
                )}

                {/* Search Instructions */}
                {searchTerm.length > 0 && searchTerm.length < 2 && (
                    <div className="p-3 bg-indigo-900 bg-opacity-50 border border-indigo-700 rounded-md">
                        <p className="text-sm text-indigo-300">Type at least 2 characters to search for users</p>
                    </div>
                )}

                {/* Search Results */}
                {showResults && searchTerm.length >= 2 && (
                    <div className="border border-slate-600 rounded-md max-h-60 overflow-y-auto bg-slate-700 shadow-lg">
                        {loading ? (
                            <div className="p-4 text-center">
                                <Spinner />
                                <p className="text-sm text-slate-400 mt-2">Searching...</p>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="divide-y divide-slate-600">
                                {searchResults.map((user) => (
                                    <div key={user.id} className="p-3 hover:bg-slate-600 flex items-center justify-between transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{user.username}</p>
                                                <p className="text-sm text-slate-400">{user.email}</p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                                        user.role === 'ProjectManager' ? 'bg-indigo-900 text-indigo-200' : 'bg-green-900 text-green-200'
                                                    }`}>
                                                        Global: {user.role}
                                                    </span>
                                                    <span className="text-xs text-slate-500">→ Project: {selectedRole}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAddUser(user)}
                                            disabled={loading}
                                            className="ml-3 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {loading ? <Spinner size="h-3 w-3" /> : 'Add'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-slate-800">
                                    <UserIcon />
                                </div>
                                <p className="text-sm font-medium text-white mb-1">
                                    No {selectedRole === 'Contributor' ? 'Contributors' : 'Project Managers'} found
                                </p>
                                <p className="text-sm text-slate-400">
                                    No users with "{selectedRole === 'Contributor' ? 'Contributor' : 'ProjectManager'}" role match "{searchTerm}"
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

    const canRemove = (userRole === 'Admin' && !isSelf) || (isCurrentUserProjectOwner && !isSelf);
    const canChangeRole = userRole === 'Admin' && !isSelf;

    const getRoleBadgeStyle = (role) => {
        switch (role) {
            case 'Admin':
                return 'bg-red-900 text-red-200 border-red-700';
            case 'ProjectManager':
                return 'bg-indigo-900 text-indigo-200 border-indigo-700';
            case 'Contributor':
                return 'bg-green-900 text-green-200 border-green-700';
            default:
                return 'bg-slate-700 text-slate-200 border-slate-600';
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
        <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700 hover:shadow-indigo-500/10 transition-shadow">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-lg font-bold relative">
                        {member.user.username.charAt(0).toUpperCase()}
                        {isOwner && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-slate-800">
                                <CrownIcon />
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white flex items-center">
                            {member.user.username}
                            {isOwner && <span className="ml-2 text-sm text-yellow-400 font-medium">(Project Owner)</span>}
                            {isSelf && <span className="ml-2 text-sm text-slate-400">(You)</span>}
                        </h3>
                        <p className="text-sm text-slate-400">{member.user.email}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center">
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
                                className="text-sm border border-slate-600 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed min-w-[130px] bg-slate-800 text-white"
                            >
                                <option value="Contributor">Contributor</option>
                                <option value="ProjectManager">Project Manager</option>
                                {/* Removed Admin option - Admins cannot be project members */}
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
                            className="text-red-400 hover:text-red-300 text-sm font-medium px-3 py-1 rounded-md border border-red-800 hover:bg-red-900/50 transition-colors flex items-center space-x-1"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 0v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>{isCurrentUserProjectOwner ? 'Kick' : 'Remove'}</span>
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
            updateProjectInfo(projectId, response.data.name);
        } catch (err) {
            setError('Failed to fetch project data. You may not have access to this project.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [projectId]); // Removed updateProjectInfo to prevent infinite loops

    useEffect(() => {
        fetchData();
    }, [projectId]); // Only depend on projectId

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
                const refreshResponse = await axios.get(`/api/project/${projectId}`);
                setProject(refreshResponse.data);
                setMembers(refreshResponse.data.members || []);
                const successMessage = isProjectOwner
                    ? `${username} has been kicked from the project`
                    : `${username} has been removed from the project`;
                setSuccessMessage(successMessage);
                setError('');
            } catch (error) {
                console.error('Error removing member:', error);
                let errorMessage = 'Failed to remove member';
                if (error.response?.status === 403) {
                    errorMessage = 'You do not have permission to remove this member';
                } else if (error.response?.status === 404) {
                    errorMessage = 'Member not found or project not found';
                } else if (error.response?.status === 400) {
                    errorMessage = error.response?.data || 'Cannot remove this member';
                } else if (error.response?.data) {
                    errorMessage = error.response.data;
                }
                setError(errorMessage);
                setTimeout(() => setError(''), 5000);
            }
        }
    };

    const handleUpdateRole = async (memberId, newRole) => {
        try {
            await axios.put(`/api/project/${projectId}/members/${memberId}`, { role: newRole });
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
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Spinner size="h-12 w-12" />
                    <p className="mt-4 text-slate-400">Loading project members...</p>
                </div>
            </div>
        );
    }

    if (error && !project) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-900 bg-opacity-50">
                        <XIcon />
                    </div>
                    <h2 className="text-lg font-medium text-white mb-2">Error Loading Project</h2>
                    <p className="text-slate-400 mb-4">{error}</p>
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
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
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-400">Project not found.</p>
                    <Link
                        to="/dashboard"
                        className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <header className="bg-slate-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Project Members</h1>
                            <p className="text-slate-400 mt-1">{project.name}</p>
                            <p className="text-sm text-slate-500">
                                Manage team members and their permissions
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {successMessage && (
                    <div className="mb-6 p-4 bg-green-900 bg-opacity-50 border border-green-700 rounded-md flex items-start space-x-2">
                        <CheckIcon />
                        <p className="text-sm text-green-300">{successMessage}</p>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-md flex items-start space-x-2">
                        <XIcon />
                        <p className="text-sm text-red-300">{error}</p>
                    </div>
                )}

                <UserSearch
                    onAddMember={handleAddMember}
                    currentMembers={members}
                    disabled={!canManageMembers}
                />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">
                            Team Members ({members.length})
                        </h2>
                        <div className="text-sm text-slate-400">
                            {isProjectOwner ? 'You are the project owner' : `Your role: ${userRoleInProject}`}
                        </div>
                    </div>

                    {members.length === 0 ? (
                        <div className="text-center py-12 bg-slate-800 rounded-lg shadow-lg border border-slate-700">
                            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-slate-700">
                                <UserIcon />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">No team members</h3>
                            <p className="text-slate-400 mb-4">Get started by adding team members to your project.</p>
                            {canManageMembers && (
                                <p className="text-sm text-indigo-400">Use the search box above to find and add users.</p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {members
                                .sort((a, b) => {
                                    if (a.user.id === project.createdBy?.id) return -1;
                                    if (b.user.id === project.createdBy?.id) return 1;
                                    const roleOrder = { 'ProjectManager': 0, 'Contributor': 1 };
                                    if (roleOrder[a.role] !== roleOrder[b.role]) {
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

                <div className="mt-8 bg-slate-800 border border-slate-700 rounded-md p-6">
                    <h3 className="text-sm font-medium text-indigo-400 mb-3 flex items-center">
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Permission Information
                    </h3>
                    <div className="text-sm text-slate-300 space-y-2">
                        <p><strong>Project Owner:</strong> Can manage all members, kick users from the project, and has full project control</p>
                        <p><strong>Project Manager:</strong> Can add members, create/assign tasks, and manage project workflow</p>
                        <p><strong>Contributor:</strong> Can work on assigned tasks and participate in project activities</p>
                        <div className="mt-3 p-3 bg-slate-700 rounded-md">
                            <p className="text-xs text-slate-400">
                                <strong>Note:</strong> Admins cannot be invited to projects. Only Contributors and Project Managers can be added as project members.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-indigo-900 rounded-lg flex items-center justify-center">
                                <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h4 className="text-lg font-semibold text-white">{members.length}</h4>
                                <p className="text-sm text-slate-400">Total Members</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-900 rounded-lg flex items-center justify-center">
                                <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h4 className="text-lg font-semibold text-white">
                                    {members.filter(m => m.role === 'ProjectManager').length}
                                </h4>
                                <p className="text-sm text-slate-400">Project Managers</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-900 rounded-lg flex items-center justify-center">
                                <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h4 className="text-lg font-semibold text-white">
                                    {members.filter(m => m.role === 'Contributor').length}
                                </h4>
                                <p className="text-sm text-slate-400">Contributors</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectMembers;