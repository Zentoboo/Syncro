import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// --- Helper Components ---
// Simple Plus Icon
const PlusIcon = () => (
    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

// Loading Spinner
const Spinner = ({ size = 'h-5 w-5' }) => (
    <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 border-blue-500`}></div>
);


// --- Modal for Creating a New Project ---
const CreateProjectModal = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="4"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                            Cancel
                        </button>
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

// --- Calendar Component ---
const Calendar = () => {
    const today = new Date();
    const monthName = today.toLocaleString('default', { month: 'long' });
    const year = today.getFullYear();

    return (
        <div className="bg-white p-6 rounded-lg shadow mt-8">
            <div className="flex justify-between items-center mb-4">
                <button className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
                <h3 className="text-xl font-bold">{`${monthName} ${year}`}</h3>
                <button className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
            </div>
            <div className="grid grid-cols-7 text-center text-sm text-gray-500">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 text-center">
                {/* This is a static representation. A full implementation would calculate days. */}
                {Array.from({ length: 35 }, (_, i) => {
                    const day = i - 3; // Placeholder logic to start the month
                    return (
                        <div key={i} className={`py-3 border rounded-md m-1 ${day > 0 && day < 32 ? '' : 'text-gray-300'}`}>
                            {day > 0 && day < 32 ? day : ''}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


// --- Main Dashboard Component ---
const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectDashboardData, setProjectDashboardData] = useState(null);
    const [loading, setLoading] = useState({ projects: true, details: false });
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    useEffect(() => {
        const fetchProjectDetails = async () => {
            if (selectedProject) {
                setLoading(prev => ({ ...prev, details: true }));
                setProjectDashboardData(null);
                try {
                    const response = await axios.get(`/api/dashboard/project/${selectedProject.id}`);
                    setProjectDashboardData(response.data);
                } catch (error) {
                    console.error("Error fetching project details:", error);
                    setProjectDashboardData(null);
                } finally {
                    setLoading(prev => ({ ...prev, details: false }));
                }
            }
        };
        fetchProjectDetails();
    }, [selectedProject]);

    const handleCreateProject = async (name, description) => {
        try {
            await axios.post('/api/project', { name, description });
            await fetchProjects(); // Refresh the project list
        } catch (error) {
            console.error("Error creating project:", error);
            // Here you could set an error state to show a message to the user
        }
    };
    
    const handleSelectProject = (project) => {
        setSelectedProject(project);
    };

    const handleNavigateToTasks = () => {
        navigate(`/project/${selectedProject.id}/tasks`);
    }

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

    const TeamMembers = ({ members }) => (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Team Members</h3>
            <ul className="space-y-2">
                {members.map(member => (
                    <li key={member.user.id} className="flex justify-between items-center text-sm">
                        <span>{member.user.username}</span>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{member.role}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
    
    const MemberContributions = ({ data }) => (
        <div className="bg-white p-6 rounded-lg shadow mt-8">
            <h3 className="text-xl font-bold mb-4">Member Contributions</h3>
            {data && data.tasksByMember.length > 0 ? (
                <ul className="space-y-4">
                    {data.tasksByMember.map(member => (
                        <li key={member.user.id} className="flex flex-col sm:flex-row justify-between sm:items-center">
                            <div className="mb-2 sm:mb-0">
                                <p className="font-semibold">{member.user.username}</p>
                                <p className="text-sm text-gray-500">
                                    {member.completedTasks} / {member.totalTasks} tasks completed
                                </p>
                            </div>
                            <div className="w-full sm:w-1/3">
                                 <div className="h-2 bg-gray-200 rounded-full">
                                    <div className="h-2 bg-green-500 rounded-full" style={{ width: `${member.totalTasks > 0 ? (member.completedTasks / member.totalTasks) * 100 : 0}%` }}></div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500">No task contribution data available for this project.</p>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                             <h1 className="text-2xl font-bold text-gray-900">Syncro Dashboard</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
                            <button
                                onClick={logout}
                                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>


            {/* Main Content */}
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Left Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-xl font-bold mb-4">Ongoing Projects</h2>
                            {loading.projects ? (
                                <div className="flex justify-center items-center h-32"><Spinner /></div>
                            ) : (
                                <ul className="space-y-2">
                                    {projects.map(project => (
                                        <li key={project.id} onClick={() => handleSelectProject(project)}
                                            className={`p-3 rounded-md cursor-pointer transition-colors ${selectedProject?.id === project.id ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-blue-100'}`}>
                                            <div className="font-semibold">{project.name}</div>
                                            <div className="text-sm">{project.taskCount} tasks</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Right Content Area */}
                    <div className="lg:col-span-3">
                        <div className="flex space-x-4 mb-8">
                            <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                <PlusIcon />
                                Create New Project
                            </button>
                            <button 
                                onClick={handleNavigateToTasks} 
                                disabled={!selectedProject}
                                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                Manage Tasks
                            </button>
                        </div>
                        
                        {loading.details ? (
                             <div className="flex justify-center items-center h-64"><Spinner size="h-10 w-10"/></div>
                        ) : selectedProject && projectDashboardData ? (
                            <div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <ProjectStatus data={projectDashboardData} />
                                    <TeamMembers members={projectDashboardData.tasksByMember} />
                                </div>
                                 <MemberContributions data={projectDashboardData} />
                                <Calendar />
                            </div>
                        ) : (
                            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                                <h3 className="text-xl font-semibold">Welcome to your Dashboard</h3>
                                <p className="mt-2">Select a project from the left to view its details or create a new one to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <CreateProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreateProject}
            />
        </div>
    );
};

export default Dashboard;