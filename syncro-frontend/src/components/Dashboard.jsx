import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRBAC } from '../hooks/useRBAC';
import { RoleBasedComponent, AdminOnly } from './RBACComponents';
import UserManagement from './UserManagement';
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
    const { user } = useAuth(); // Get the current user from auth context

    // Find the current user's role within this specific project
    const userRoleInProject = project?.members?.find(m => m.user.username === user?.username)?.role;

    const addMember = async () => {
        if (!newMemberUsername.trim()) return;
        try {
            setLoading(true);
            await axios.post(`/api/project/${project.id}/members`, {
                username: newMemberUsername,
                role: newMemberRole
            });
            onMemberUpdate(); // Callback to refresh data
            setNewMemberUsername('');
            alert('Member added successfully');
        } catch (error) {
            console.error('Error adding member:', error);
            alert(error.response?.data || 'Failed to add member');
        } finally {
            setLoading(false);
        }
    };

    const removeMember = async (memberId) => {
        try {
            await axios.delete(`/api/project/${project.id}/members/${memberId}`);
            onMemberUpdate(); // Callback to refresh data
            alert('Member removed successfully');
        } catch (error) {
            console.error('Error removing member:', error);
            alert('Failed to remove member');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-96 overflow-y-auto">
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

// --- Create Project Modal ---
const CreateProjectModal = ({ isOpen, onClose, onCreate }) => {
    // This component is fine as it was.
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
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
                <form onSubmit={handleSubmit}>
                     {/* Form content is correct, no changes needed */}
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
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');

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

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);
    
    // This effect now correctly depends on the `selectedProject` ID
    useEffect(() => {
        const fetchProjectDetails = async () => {
            if (selectedProject?.id) {
                setLoading(prev => ({ ...prev, details: true }));
                setProjectDashboardData(null);
                try {
                    const [detailsRes, projectRes] = await Promise.all([
                        axios.get(`/api/dashboard/project/${selectedProject.id}`),
                        axios.get(`/api/project/${selectedProject.id}`) // Also fetch full project data for members list
                    ]);
                    setProjectDashboardData(detailsRes.data);
                    setSelectedProject(projectRes.data); // Update selected project with fresh data
                } catch (error) {
                    console.error("Error fetching project details:", error);
                    setProjectDashboardData(null);
                } finally {
                    setLoading(prev => ({ ...prev, details: false }));
                }
            }
        };
        fetchProjectDetails();
    }, [selectedProject?.id]);


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

    // **IMPROVED LOGIC**: This now reliably refreshes the project details.
    const handleMemberUpdate = async () => {
        await fetchProjects();
        if (selectedProject) {
            try {
                 const response = await axios.get(`/api/project/${selectedProject.id}`);
                 setSelectedProject(response.data);
            } catch (error) {
                console.error("Error refreshing project data", error)
            }
        }
    };
    
    const getUserRoleInProject = (project) => project?.userRole || "Contributor";

    const handleNavigateToTasks = () => {
        if(selectedProject) {
            navigate(`/project/${selectedProject.id}/tasks`);
        }
    };

    const ProjectStatus = ({ data }) => (
        <div className="bg-white p-6 rounded-lg shadow">
            {/* This component is correct, no changes needed */}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                {/* Header and tabs are correct, no changes needed */}
            </header>

            {/* Main Content */}
            <main className="p-4 sm:p-6 lg:p-8">
                {activeTab === 'users' ? (
                    <AdminOnly><UserManagement /></AdminOnly>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Left Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-6 rounded-lg shadow">
                                {/* Project list is correct, no changes needed */}
                            </div>
                        </div>

                        {/* Right Content Area */}
                        <div className="lg:col-span-3">
                            {loading.details ? (
                                <div className="flex justify-center items-center h-64"><Spinner size="h-10 w-10" /></div>
                            ) : selectedProject && projectDashboardData ? (
                                <div>
                                    <div className="bg-white p-6 rounded-lg shadow mb-8">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h2>
                                                <p className="text-gray-600 mt-1">{selectedProject.description}</p>
                                            </div>
                                            <div className="flex space-x-3">
                                                <RoleBasedComponent allowedRoles={['Admin', 'ProjectManager']} userRoleInProject={getUserRoleInProject(selectedProject)}>
                                                    <button onClick={() => setIsMembersModalOpen(true)} className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700">Manage Members</button>
                                                    <button onClick={handleNavigateToTasks} className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700">Manage Tasks</button>
                                                </RoleBasedComponent>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Project details rendering is correct */}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                                    <h3 className="text-xl font-semibold">Welcome to your Dashboard</h3>
                                    <p className="mt-2">{projects.length === 0 ? "You don't have access to any projects yet." : "Select a project from the left to view its details."}</p>
                                    {canCreateProject() && projects.length === 0 && (
                                        <button onClick={() => setIsCreateModalOpen(true)} className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                            <PlusIcon />Create Your First Project
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateProject} />
            <ProjectMembersModal isOpen={isMembersModalOpen} onClose={() => setIsMembersModalOpen(false)} project={selectedProject} onMemberUpdate={handleMemberUpdate} />
        </div>
    );
};

export default Dashboard;