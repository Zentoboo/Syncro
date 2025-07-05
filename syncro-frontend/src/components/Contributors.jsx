// src/components/Contributors.jsx - Simple test version
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';

const Contributors = () => {
    const { projectId } = useParams();
    const { user } = useAuth();
    const { updateProjectInfo } = useBreadcrumb();
    const [project, setProject] = useState(null);
    const [contributors, setContributors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    console.log('Contributors component loaded, projectId:', projectId);

    const fetchData = useCallback(async () => {
        console.log('Fetching data for project:', projectId);
        setLoading(true);
        setError('');
        try {
            const [projectRes, dashboardRes] = await Promise.all([
                axios.get(`/api/project/${projectId}`),
                axios.get(`/api/dashboard/project/${projectId}`)
            ]);
            console.log('Project data:', projectRes.data);
            console.log('Dashboard data:', dashboardRes.data);
            setProject(projectRes.data);
            setContributors(dashboardRes.data.tasksByMember || []);
            
            // Update breadcrumb context with project name
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading contributors...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-lg mb-4">Error</div>
                    <p className="text-gray-600">{error}</p>
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
                            <h1 className="text-3xl font-bold text-gray-900">Project Contributors</h1>
                            <p className="text-gray-600 mt-1">{project.description}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link 
                                to={`/project/${projectId}/tasks`} 
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                            >
                                Back to Tasks
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Contributors ({contributors.length})</h2>
                    
                    {contributors.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-lg mb-2">No contributors found</div>
                            <p className="text-gray-500">Tasks haven't been assigned to team members yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {contributors.map((member) => (
                                <div key={member.user.id} className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                            {member.user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">{member.user.username}</h3>
                                            <p className="text-sm text-gray-500">{member.user.email}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4">
                                        <div className="flex justify-between text-sm">
                                            <span>Tasks: {member.completedTasks}/{member.totalTasks}</span>
                                            <span>{member.totalTasks > 0 ? Math.round((member.completedTasks / member.totalTasks) * 100) : 0}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                            <div 
                                                className="bg-green-500 h-2 rounded-full" 
                                                style={{ 
                                                    width: `${member.totalTasks > 0 ? (member.completedTasks / member.totalTasks) * 100 : 0}%` 
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                        <div className="text-center p-2 bg-blue-50 rounded">
                                            <div className="font-medium text-blue-600">{member.inProgressTasks}</div>
                                            <div className="text-gray-500">In Progress</div>
                                        </div>
                                        <div className="text-center p-2 bg-gray-100 rounded">
                                            <div className="font-medium text-gray-600">{member.todoTasks}</div>
                                            <div className="text-gray-500">To Do</div>
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