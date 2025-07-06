import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRBAC } from '../hooks/useRBAC';
import { RoleBasedComponent, AdminOnly } from './RBACComponents';
import UserManagement from './UserManagement';
import Calendar from './Calendar';
import axios from 'axios';

// --- Helper Components ---
const PlusIcon = () => (
    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const Spinner = ({ size = 'h-5 w-5' }) => (
    <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 border-blue-500`}></div>
);

// --- Project Member Management Modal ---
const ProjectMembersModal = ({ isOpen, onClose, project, onMemberUpdate }) => {
    const [newMemberUsername, setNewMemberUsername] = useState('');
    const [newMemberRole, setNewMemberRole] = useState('Contributor');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const userRoleInProject = project?.members?.find(m => m.user.username === user?.username)?.role;

    const addMember = async () => {
        if (!newMemberUsername.trim()) return;
        try {
            setLoading(true);
            await axios.post(`/api/project/${project.id}/members`, { username: newMemberUsername, role: newMemberRole });
            onMemberUpdate();
            setNewMemberUsername('');
            alert('Member added successfully');
        } catch (error) {
            alert(error.response?.data || 'Failed to add member');
        } finally {
            setLoading(false);
        }
    };

    const removeMember = async (memberId) => {
        try {
            await axios.delete(`/api/project/${project.id}/members/${memberId}`);
            onMemberUpdate();
            alert('Member removed successfully');
        } catch (error) {
            alert('Failed to remove member');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">Manage Project Members</h2>
                <RoleBasedComponent allowedRoles={['Admin', 'ProjectManager']} userRoleInProject={userRoleInProject}>
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-lg font-medium mb-4">Add New Member</h3>
                        <div className="flex space-x-4">
                            <input type="text" value={newMemberUsername} onChange={(e) => setNewMemberUsername(e.target.value)} placeholder="Username" className="flex-1 px-3 py-2 border border-gray-300 rounded-md" />
                            <select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md">
                                <option value="Contributor">Contributor</option>
                                <option value="ProjectManager">Project Manager</option>
                            </select>
                            <button onClick={addMember} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400">
                                {loading ? <Spinner size="h-4 w-4" /> : 'Add'}
                            </button>
                        </div>
                    </div>
                </RoleBasedComponent>
                <div>
                    <h3 className="text-lg font-medium mb-4">Current Members</h3>
                    <div className="space-y-2">
                        {project?.members?.map(member => (
                            <div key={member.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <span className="font-medium">{member.user.username}</span>
                                    <span className="ml-2 text-sm text-gray-500">({member.user.email})</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className={`px-2 py-1 text-xs rounded-full ${member.role === 'Admin' ? 'bg-red-100 text-red-800' : member.role === 'ProjectManager' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                        {member.role}
                                    </span>
                                    <RoleBasedComponent allowedRoles={['Admin']} userRoleInProject={userRoleInProject}>
                                        <button onClick={() => removeMember(member.id)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                                    </RoleBasedComponent>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
                </div>
            </div>
        </div>
    );
};

// --- Notification Component ---
const NotificationBell = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const fetchNotifications = useCallback(async () => {
        try {
            // Fetch recent notifications for display (limit to 10 for dropdown)
            const notificationsResponse = await axios.get('/api/notification');
            const recentNotifications = notificationsResponse.data.slice(0, 10);
            setNotifications(recentNotifications);

            // Calculate actual unread count from all notifications
            const totalUnreadCount = notificationsResponse.data.filter(n => !n.isRead).length;
            setUnreadCount(totalUnreadCount);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            try {
                await axios.post(`/api/notification/${notification.id}/mark-as-read`);
                // Update local state immediately
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === notification.id ? { ...n, isRead: true } : n
                    )
                );
                // Decrease unread count
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
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full hover:bg-gray-100">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-5 w-5 rounded-full ring-2 ring-white bg-red-500 text-white text-xs flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20">
                    <div className="py-2">
                        <div className="px-4 py-2 font-bold text-gray-800 flex items-center justify-between">
                            <span>Notifications</span>
                            {unreadCount > 0 && (
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                    {unreadCount} unread
                                </span>
                            )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`px-4 py-3 border-b border-gray-100 cursor-pointer ${!n.isRead ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-start">
                                        {!n.isRead && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                        )}
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-700">{n.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(n.createdAt).toLocaleString()} • {n.triggeredByUsername}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="px-4 py-3 text-sm text-gray-500">No new notifications.</div>
                            )}
                        </div>
                        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate('/notifications');
                                }}
                                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 hover:bg-blue-50 rounded transition-colors"
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

// --- Create Project Modal ---
const CreateProjectModal = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const { canCreateProject } = useRBAC();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canCreateProject()) {
            alert('You do not have permission to create projects');
            return;
        }
        setLoading(true);
        await onCreate(name, description);
        setLoading(false);
        setName('');
        setDescription('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center">
                            {loading && <Spinner size="h-4 w-4 mr-2" />}
                            {loading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Main Dashboard Component ---
const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { canCreateProject } = useRBAC();
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectDashboardData, setProjectDashboardData] = useState(null);
    const [loading, setLoading] = useState({ projects: true, details: false });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [projectTasks, setProjectTasks] = useState([]);


    const fetchProjects = useCallback(async () => {
        setLoading(prev => ({ ...prev, projects: true }));
        try {
            const response = await axios.get('/api/project');
            setProjects(response.data || []);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(prev => ({ ...prev, projects: false }));
        }
    }, []);

    const fetchProjectTasks = useCallback(async () => {
    if (!selectedProject?.id) {
        setProjectTasks([]);
        return;
    }

    try {
        const response = await axios.get(`/api/task?projectId=${selectedProject.id}`);
        setProjectTasks(response.data);
    } catch (error) {
        console.error("Error fetching project tasks:", error);
        setProjectTasks([]);
    }
    }, [selectedProject?.id]);

    useEffect(() => {
    fetchProjectTasks();
    }, [fetchProjectTasks]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const fetchProjectDetails = useCallback(async () => {
        if (selectedProject?.id) {
            setLoading(prev => ({ ...prev, details: true }));
            setProjectDashboardData(null);
            try {
                const [detailsRes, projectRes] = await Promise.all([
                    axios.get(`/api/dashboard/project/${selectedProject.id}`),
                    axios.get(`/api/project/${selectedProject.id}`)
                ]);
                setProjectDashboardData(detailsRes.data);
                setSelectedProject(projectRes.data);
            } catch (error) {
                console.error("Error fetching project details:", error);
                setProjectDashboardData(null);
            } finally {
                setLoading(prev => ({ ...prev, details: false }));
            }
        }
    }, [selectedProject?.id]);

    useEffect(() => {
        fetchProjectDetails();
    }, [fetchProjectDetails]);

    const handleCreateProject = async (name, description) => {
        try {
            await axios.post('/api/project', { name, description });
            await fetchProjects();
        } catch (error) {
            console.error("Error creating project:", error);
            alert('Failed to create project');
        }
    };

    const handleSelectProject = (project) => {
        setSelectedProject(project);
        setActiveTab('dashboard');
    };

    const handleMemberUpdate = async () => {
        await fetchProjects();
        if (selectedProject) {
            fetchProjectDetails();
        }
    };

    const getUserRoleInProject = (project) => project?.userRole || "Contributor";

    const handleNavigateToTasks = () => {
        if (selectedProject) {
            navigate(`/project/${selectedProject.id}/tasks`);
        }
    };

    const handleViewAllContributors = () => {
        if (selectedProject) {
            navigate(`/project/${selectedProject.id}/contributors`);
        }
    };

    const ProjectStatus = ({ data }) => (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Project Status</h3>
            <div className="space-y-3">
                <div className="flex justify-between"><span>Total Tasks:</span> <strong>{data.totalTasks}</strong></div>
                <div className="flex justify-between"><span>Completed:</span> <strong>{data.completedTasks}</strong></div>
                <div className="flex justify-between items-center">
                    <span>Progress:</span>
                    <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${data.progressPercentage}%` }}></div>
                    </div>
                    <strong>{data.progressPercentage}%</strong>
                </div>
            </div>
        </div>
    );

    const Contributors = ({ members, onViewAll }) => (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Contributors</h3>
                <button
                    onClick={onViewAll}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                    View All →
                </button>
            </div>
            <div className="space-y-3">
                {members.slice(0, 5).map(member => (
                    <div key={member.user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {member.user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-medium text-sm">{member.user.username}</div>
                                <div className="text-xs text-gray-500">{member.user.email}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                                {member.completedTasks}/{member.totalTasks}
                            </div>
                            <div className="text-xs text-gray-500">tasks done</div>
                            <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                                <div
                                    className="bg-green-500 h-1.5 rounded-full"
                                    style={{
                                        width: `${member.totalTasks > 0 ? (member.completedTasks / member.totalTasks) * 100 : 0}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
                {members.length > 5 && (
                    <div className="text-center pt-2">
                        <span className="text-sm text-gray-500">
                            +{members.length - 5} more contributors
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <h1 className="text-2xl font-bold text-gray-900">Syncro Dashboard</h1>
                            <nav className="flex space-x-8">
                                <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
                                    Dashboard
                                </button>
                                <AdminOnly>
                                    <button onClick={() => setActiveTab('users')} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'users' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
                                        User Management
                                    </button>
                                </AdminOnly>
                            </nav>
                        </div>
                        <div className="flex items-center space-x-4">
                            <NotificationBell user={user} />
                            <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
                            <span className={`font-medium px-2 py-1 rounded-full text-xs ${user?.role === 'Admin' ? 'bg-red-100 text-red-800' :
                                    user?.role === 'ProjectManager' ? 'bg-blue-100 text-blue-800' :
                                        'bg-green-100 text-green-800'
                                }`}>
                                {user?.role}
                            </span>
                            <button onClick={logout} className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 sm:p-6 lg:p-8">
                {activeTab === 'users' ? (
                    <AdminOnly><UserManagement /></AdminOnly>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Left Sidebar - My Projects */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">My Projects</h2>
                                    {/* NEW PROJECT BUTTON MOVED HERE */}
                                    <RoleBasedComponent allowedRoles={['Admin', 'ProjectManager']} userRoleInProject={user?.role}>
                                        <button
                                            onClick={() => setIsCreateModalOpen(true)}
                                            className="flex items-center justify-center p-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                                            title="Create New Project"
                                        >
                                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                    </RoleBasedComponent>
                                </div>
                                {loading.projects ? (
                                    <div className="flex justify-center items-center h-32"><Spinner /></div>
                                ) : (
                                    <>
                                        <ul className="space-y-2">
                                            {projects.map(project => (
                                                <li key={project.id} onClick={() => handleSelectProject(project)} className={`p-3 rounded-md cursor-pointer transition-colors ${selectedProject?.id === project.id ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-blue-100'}`}>
                                                    <div className="font-semibold">{project.name}</div>
                                                    <div className="text-sm">{project.taskCount} tasks</div>
                                                </li>
                                            ))}
                                        </ul>
                                        {projects.length === 0 && (
                                            <div className="text-center text-gray-500 py-8">
                                                <p className="mb-4">No projects found.</p>
                                                {canCreateProject() && (
                                                    <button
                                                        onClick={() => setIsCreateModalOpen(true)}
                                                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                                    >
                                                        <PlusIcon />Create Your First Project
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right Content Area */}
                        <div className="lg:col-span-3">
                            {/* Action buttons for selected project */}
                            {selectedProject && (
                                <div className="mb-6 flex flex-wrap gap-4 items-center">
                                    <button
                                        onClick={handleNavigateToTasks}
                                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                                    >
                                        Manage Tasks
                                    </button>

                                    <RoleBasedComponent allowedRoles={['Admin', 'ProjectManager']} userRoleInProject={getUserRoleInProject(selectedProject)}>
                                        <button
                                            onClick={() => navigate(`/project/${selectedProject.id}/members`)}
                                            className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
                                        >
                                            Manage Members
                                        </button>
                                    </RoleBasedComponent>
                                </div>
                            )}

                            {loading.details ? (
                                <div className="flex justify-center items-center h-64"><Spinner size="h-10 w-10" /></div>
                            ) : selectedProject && projectDashboardData ? (
                                <div>
                                    <div className="bg-white p-6 rounded-lg shadow mb-8">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
                                                <p className="text-gray-600 mt-1">{selectedProject.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <ProjectStatus data={projectDashboardData} />
                                        <Contributors members={projectDashboardData.tasksByMember} onViewAll={handleViewAllContributors} />
                                    </div>
                                    <Calendar
                                     selectedProject={selectedProject}
                                     projectTasks={projectTasks}
                                    />
                                </div>
                            ) : (
                                <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                                    <h3 className="text-xl font-semibold">Welcome to your Dashboard</h3>
                                    <p className="mt-2">{projects.length === 0 ? "You have no projects yet." : "Select a project from the left to view its details."}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateProject} />
        </div>
    );
};

export default Dashboard;
