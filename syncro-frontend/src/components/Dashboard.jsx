import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRBAC } from '../hooks/useRBAC';
import { RoleBasedComponent, AdminOnly } from './RBACComponents';
import UserManagement from './UserManagement';
import Calendar from './Calendar';
import Header from './Header';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

// --- Helper Components ---
const PlusIcon = () => (
    <svg className="h-6 w-6 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const MailIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const TriangleIcon = () => (
    <svg className="h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
        <path d="M6.42,21,17.58,12,6.42,3Z" />
    </svg>
);

const SectionIcon = () => (
    <div className="w-4 h-4 bg-indigo-500 rounded-sm mr-3 flex-shrink-0"></div>
);

const Spinner = ({ size = 'h-6 w-6' }) => (
    <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 border-indigo-400`}></div>
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
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-slate-800 text-gray-100 p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
                <h2 className="text-3xl font-bold mb-6">Manage Project Members</h2>
                <RoleBasedComponent allowedRoles={['Admin', 'ProjectManager']} userRoleInProject={userRoleInProject}>
                    <div className="mb-6 p-6 bg-slate-700 rounded-lg">
                        <h3 className="text-xl font-medium mb-4">Add New Member</h3>
                        <div className="flex space-x-4">
                            <input type="text" value={newMemberUsername} onChange={(e) => setNewMemberUsername(e.target.value)} placeholder="Username" className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500" />
                            <select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} className="px-4 py-3 bg-slate-800 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500">
                                <option value="Contributor">Contributor</option>
                                <option value="ProjectManager">Project Manager</option>
                            </select>
                            <button onClick={addMember} disabled={loading} className="px-5 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
                                {loading ? <Spinner size="h-5 w-5" /> : 'Add'}
                            </button>
                        </div>
                    </div>
                </RoleBasedComponent>
                <div>
                    <h3 className="text-xl font-medium mb-4">Current Members</h3>
                    <div className="space-y-3">
                        {project?.members?.map(member => (
                            <div key={member.id} className="flex justify-between items-center p-4 bg-slate-700 rounded-lg">
                                <div>
                                    <span className="font-medium text-lg">{member.user.username}</span>
                                    <span className="ml-3 text-base text-gray-400">({member.user.email})</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className={`px-3 py-1 text-sm rounded-full ${member.role === 'Admin' ? 'bg-red-200 text-red-800' : member.role === 'ProjectManager' ? 'bg-indigo-200 text-indigo-800' : 'bg-green-200 text-green-800'}`}>
                                        {member.role}
                                    </span>
                                    <RoleBasedComponent allowedRoles={['Admin']} userRoleInProject={userRoleInProject}>
                                        <button onClick={() => removeMember(member.id)} className="text-red-500 hover:text-red-400 text-base">Remove</button>
                                    </RoleBasedComponent>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end mt-8">
                    <button onClick={onClose} className="px-5 py-3 bg-slate-600 text-gray-200 rounded-md hover:bg-slate-500">Close</button>
                </div>
            </div>
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
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-slate-800 text-gray-100 p-8 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700">
                <h2 className="text-3xl font-bold mb-6">Create New Project</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <label htmlFor="name" className="block text-base font-medium text-gray-300 mb-2">Name</label>
                        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                    <div className="mb-8">
                        <label htmlFor="description" className="block text-base font-medium text-gray-300 mb-2">Description</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="5" className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-slate-600 text-gray-200 rounded-md hover:bg-slate-500">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center">
                            {loading && <Spinner size="h-5 w-5 mr-3" />}
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
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const { canCreateProject } = useRBAC();
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectDashboardData, setProjectDashboardData] = useState(null);
    const [loading, setLoading] = useState({ projects: true, details: false });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

    const handleSendDigest = async (projectId, projectName) => {
        if (!window.confirm(`Send daily digest for "${projectName}"?`)) {
            return;
        }

        try {
            await axios.post(`/api/dailydigest/send-digests?projectId=${projectId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            alert(`Daily digest for "${projectName}" has been queued for sending!`);
        } catch (error) {
            console.error("Error sending digest:", error);
            alert(`Failed to send digest for "${projectName}". Check the console for details.`);
        }
    };

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

    const handleNavigateToTasks = () => selectedProject && navigate(`/project/${selectedProject.id}/tasks`);
    const handleViewAllContributors = () => selectedProject && navigate(`/project/${selectedProject.id}/contributors`);

    const ProjectStatus = ({ data }) => {
        const pieData = [
            { name: 'Completed', value: data.completedTasks },
            { name: 'Remaining', value: data.totalTasks - data.completedTasks },
        ];
        const COLORS = ['#4f46e5', '#475569']; // Indigo-600, Slate-600

        return (
            <div className="bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700">
                <h3 className="text-2xl font-bold mb-6 text-gray-100 flex items-center">
                    <SectionIcon />
                    Project Status
                </h3>
                <div className="flex items-center space-x-6">
                    <div style={{ width: 150, height: 150 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-4 text-lg flex-1">
                        <div className="flex justify-between text-gray-300">
                            <span>Total Tasks:</span>
                            <strong className="text-white">{data.totalTasks}</strong>
                        </div>
                        <div className="flex justify-between text-gray-300">
                            <span>Completed:</span>
                            <strong className="text-white">{data.completedTasks}</strong>
                        </div>
                        <div className="flex justify-between text-gray-300">
                            <span>Progress:</span>
                            <strong className="text-white">{data.progressPercentage}%</strong>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const Contributors = ({ members, onViewAll }) => (
        <div className="bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-100 flex items-center">
                    <SectionIcon />
                    Contributors
                </h3>
                <button
                    onClick={onViewAll}
                    className="text-base text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                    View All →
                </button>
            </div>
            <div className="space-y-4">
                {members.slice(0, 5).map(member => (
                    <div key={member.user.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                {member.user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-medium text-lg text-gray-100">{member.user.username}</div>
                                <div className="text-sm text-gray-400">{member.user.email}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-medium text-gray-100">
                                {member.completedTasks}/{member.totalTasks}
                            </div>
                            <div className="text-sm text-gray-400">tasks done</div>
                            <div className="w-20 bg-slate-600 rounded-full h-2 mt-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${member.totalTasks > 0 ? (member.completedTasks / member.totalTasks) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
                {members.length > 5 && (
                    <div className="text-center pt-2">
                        <span className="text-base text-gray-400">
                            +{members.length - 5} more contributors
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-900 text-gray-200">
            {/* Header component */}
            <Header showUserManagement={true} />
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-1">
                            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                                <div className="flex justify-between items-center mb-5">
                                    <h2 className="text-2xl font-bold text-white">My Projects</h2>
                                    <RoleBasedComponent allowedRoles={['Admin', 'ProjectManager']} userRoleInProject={user?.role}>
                                        <button
                                            onClick={() => setIsCreateModalOpen(true)}
                                            className="flex items-center justify-center p-3 text-sm font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
                                            title="Create New Project"
                                        >
                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                    </RoleBasedComponent>
                                </div>
                                {loading.projects ? (
                                    <div className="flex justify-center items-center h-40"><Spinner /></div>
                                ) : (
                                    <>
                                        <ul className="space-y-3">
                                            {projects.map(project => (
                                                <li key={project.id} className={`p-4 rounded-lg transition-all duration-200 ${selectedProject?.id === project.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-700 hover:bg-slate-600 hover:shadow-md text-gray-200'}`}>
                                                    <div className="flex justify-between items-center">
                                                        <div className="cursor-pointer flex-grow" onClick={() => handleSelectProject(project)}>
                                                            <div className="font-semibold text-lg">{project.name}</div>
                                                            <div className="text-sm opacity-80">{project.taskCount} tasks</div>
                                                        </div>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Prevent project selection
                                                                handleSendDigest(project.id, project.name);
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-indigo-300 hover:bg-slate-800 rounded-full transition-colors"
                                                            title={`Send digest for ${project.name}`}
                                                        >
                                                            <MailIcon />
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        {projects.length === 0 && (
                                            <div className="text-center text-gray-400 py-10">
                                                <p className="mb-4 text-lg">No projects found.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-3">
                            {loading.details ? (
                                <div className="flex justify-center items-center h-96"><Spinner size="h-16 w-16" /></div>
                            ) : selectedProject && projectDashboardData ? (
                                <div>
                                    <div className="bg-slate-800 p-8 rounded-xl shadow-lg mb-6 border border-slate-700 flex flex-col gap-4">
                                        {/* Top Row: Title and Buttons */}
                                        <div className="flex justify-between items-center">
                                            <h2 className="text-4xl font-bold text-white flex items-center">
                                                <SectionIcon />
                                                {selectedProject.name}
                                            </h2>
                                            <div className="flex flex-wrap gap-4">
                                                <button
                                                    onClick={handleNavigateToTasks}
                                                    className="px-5 py-3 text-base bg-green-600 text-white rounded-md hover:bg-green-700"
                                                >
                                                    Manage Tasks
                                                </button>
                                                <RoleBasedComponent allowedRoles={['Admin', 'ProjectManager']} userRoleInProject={projects.find(p => p.id === selectedProject.id)?.userRole}>
                                                    <button
                                                        onClick={() => navigate(`/project/${selectedProject.id}/members`)}
                                                        className="px-5 py-3 text-base bg-slate-600 text-white rounded-md hover:bg-slate-500"
                                                    >
                                                        Manage Members
                                                    </button>
                                                </RoleBasedComponent>
                                            </div>
                                        </div>
                                        {/* Bottom Row: Description */}
                                        <div>
                                            <p className="text-gray-300 text-lg">{selectedProject.description}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <ProjectStatus data={projectDashboardData} />
                                        <Contributors members={projectDashboardData.tasksByMember} onViewAll={handleViewAllContributors} />
                                    </div>
                                    <div className="mt-6">
                                        <Calendar
                                            selectedProject={selectedProject}
                                            projectTasks={projectTasks}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-800 p-12 rounded-xl shadow-lg text-center text-gray-400 border border-slate-700">
                                    <h3 className="text-3xl font-semibold text-gray-200">Welcome to your Dashboard</h3>
                                    <p className="mt-4 text-lg">{projects.length === 0 ? "You have no projects yet." : "Select a project from the left to view its details."}</p>
                                </div>
                            )}
                        </div>
                    </div>
            </main>

            <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateProject} />
        </div>
    );
};

export default Dashboard;