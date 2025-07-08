// zentoboo/syncro/Syncro-bc266b2d3b44722e8ff4501783c8d62f150e59ee/syncro-frontend/src/components/Contributors.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';

import { Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const Contributors = () => {
    const { projectId } = useParams();
    const { user } = useAuth();
    const { updateProjectInfo } = useBreadcrumb();
    const [project, setProject] = useState(null);
    const [contributors, setContributors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [projectRes, dashboardRes] = await Promise.all([
                axios.get(`/api/project/${projectId}`),
                axios.get(`/api/dashboard/project/${projectId}`)
            ]);
            setProject(projectRes.data);
            setContributors(dashboardRes.data.tasksByMember || []);
            updateProjectInfo(projectId, projectRes.data.name);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to fetch project data. You may not have access to this project.');
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-400 mx-auto"></div>
                    <p className="mt-4 text-slate-400">Loading contributors...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-400 text-lg mb-4">Error</div>
                    <p className="text-slate-400">{error}</p>
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

    // Aggregate data for pie chart
    const totalTodo = contributors.reduce((sum, m) => sum + m.todoTasks, 0);
    const totalInProgress = contributors.reduce((sum, m) => sum + m.inProgressTasks, 0);
    const totalCompleted = contributors.reduce((sum, m) => sum + m.completedTasks, 0);

    const pieData = {
        labels: ['To Do', 'In Progress', 'Completed'],
        datasets: [
            {
                data: [totalTodo, totalInProgress, totalCompleted],
                backgroundColor: ['#94a3b8', '#38bdf8', '#4ade80'],
                borderWidth: 1,
            },
        ],
    };

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: 'white'
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <header className="bg-slate-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Project Contributors</h1>
                            <p className="text-slate-400 mt-1">{project.description}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link 
                                to="/dashboard" 
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
                            >
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
                {/* Pie Chart Section */}
                <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                    <h2 className="text-xl font-semibold text-white mb-4">Task Distribution</h2>
                    <div className="max-w-sm mx-auto">
                        <Pie data={pieData} options={pieOptions} />
                    </div>
                </div>

                {/* Contributors Grid */}
                <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                    <h2 className="text-xl font-semibold text-white mb-4">Contributors ({contributors.length})</h2>
                    {contributors.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-slate-500 text-lg mb-2">No contributors found</div>
                            <p className="text-slate-400">Tasks haven't been assigned to team members yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {contributors.map((member) => (
                                <div key={member.user.id} className="bg-slate-700 rounded-lg p-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                                            {member.user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-white">{member.user.username}</h3>
                                            <p className="text-sm text-slate-400">{member.user.email}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex justify-between text-sm">
                                            <span>Tasks: {member.completedTasks}/{member.totalTasks}</span>
                                            <span>{member.totalTasks > 0 ? Math.round((member.completedTasks / member.totalTasks) * 100) : 0}%</span>
                                        </div>
                                        <div className="w-full bg-slate-600 rounded-full h-2 mt-1">
                                            <div 
                                                className="bg-green-500 h-2 rounded-full" 
                                                style={{ width: `${member.totalTasks > 0 ? (member.completedTasks / member.totalTasks) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                        <div className="text-center p-2 bg-indigo-900/50 rounded">
                                            <div className="font-medium text-indigo-300">{member.inProgressTasks}</div>
                                            <div className="text-slate-400">In Progress</div>
                                        </div>
                                        <div className="text-center p-2 bg-slate-600 rounded">
                                            <div className="font-medium text-slate-300">{member.todoTasks}</div>
                                            <div className="text-slate-400">To Do</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Contributors;
