// src/components/tasks-application.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useRBAC } from '../hooks/useRBAC';
import { RoleBasedComponent } from './RBACComponents';

// --- Helper Components ---
const Spinner = ({ size = 'h-5 w-5' }) => (
    <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 border-blue-500`}></div>
);

const PlusIcon = () => (
    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);


const priorityStyles = {
    0: { text: 'Low', bg: 'bg-gray-200', text_color: 'text-gray-800' },
    1: { text: 'Medium', bg: 'bg-blue-200', text_color: 'text-blue-800' },
    2: { text: 'High', bg: 'bg-yellow-200', text_color: 'text-yellow-800' },
    3: { text: 'Critical', bg: 'bg-red-200', text_color: 'text-red-800' }
};

const statusMap = {
    0: "To Do",
    1: "In Progress",
    2: "In Review",
    3: "Done"
};

// --- Task Creation/Edit Modal ---
const TaskModal = ({ isOpen, onClose, onSave, projectMembers, existingTask = null }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedToUserId, setAssignedToUserId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (existingTask) {
            setTitle(existingTask.title);
            setDescription(existingTask.description);
            setAssignedToUserId(existingTask.assignedTo?.id || '');
            setDueDate(existingTask.dueDate ? existingTask.dueDate.split('T')[0] : '');
            setPriority(existingTask.priority);
        } else {
            setTitle('');
            setDescription('');
            setAssignedToUserId('');
            setDueDate('');
            setPriority(1);
        }
    }, [existingTask, isOpen]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const taskData = {
            title,
            description,
            assignedToUserId: assignedToUserId ? parseInt(assignedToUserId, 10) : null,
            dueDate: dueDate || null,
            priority,
            // Status is handled by action buttons, not in the modal
        };
        await onSave(taskData, existingTask ? existingTask.id : null);
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">{existingTask ? 'Edit Task Details' : 'Create New Task'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Task Title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 border rounded" />
                    <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded" rows="3"></textarea>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select value={assignedToUserId} onChange={e => setAssignedToUserId(e.target.value)} className="w-full p-2 border rounded">
                            <option value="">Assign to...</option>
                            {projectMembers.map(member => <option key={member.user.id} value={member.user.id}>{member.user.username}</option>)}
                        </select>
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-2 border rounded" />
                    </div>
                    <div className="grid grid-cols-1">
                        <select value={priority} onChange={e => setPriority(parseInt(e.target.value, 10))} className="w-full p-2 border rounded">
                            <option value="0">Low</option>
                            <option value="1">Medium</option>
                            <option value="2">High</option>
                            <option value="3">Critical</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-400">
                            {loading ? 'Saving...' : 'Save Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Task Card ---
const TaskCard = ({ task, userRole, onEdit, onUpdateStatus, onDelete }) => {

    const renderActions = () => {
        const isManager = userRole === 'Admin' || userRole === 'ProjectManager';

        switch (task.status) {
            case 0: // ToDo
                return <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(task.id, 1); }} className="w-full mt-2 px-3 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600">Start Task</button>;
            case 1: // In Progress
                return <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(task.id, 2); }} className="w-full mt-2 px-3 py-1 text-xs text-white bg-purple-500 rounded hover:bg-purple-600">Submit for Review</button>;
            case 2: // In Review
                if (isManager) {
                    return (
                        <div className="flex space-x-2 mt-2">
                            <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(task.id, 1); }} className="w-full px-3 py-1 text-xs text-white bg-yellow-500 rounded hover:bg-yellow-600">Reject</button>
                            <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(task.id, 3); }} className="w-full px-3 py-1 text-xs text-white bg-green-500 rounded hover:bg-green-600">Approve</button>
                        </div>
                    );
                }
                return null;
            default: // Done
                return null;
        }
    };

    return (
        <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 mb-3" >
            <div className="flex justify-between items-start cursor-pointer" onClick={() => onEdit(task)}>
                <h4 className="font-semibold text-sm">{task.title}</h4>
                <RoleBasedComponent allowedRoles={['Admin', 'ProjectManager']} userRoleInProject={userRole}>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="text-gray-400 hover:text-red-500"><TrashIcon /></button>
                </RoleBasedComponent>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs">
                <span className={`px-2 py-1 rounded-full ${priorityStyles[task.priority].bg} ${priorityStyles[task.priority].text_color}`}>
                    {priorityStyles[task.priority].text}
                </span>
                <span>{task.assignedTo?.username || 'Unassigned'}</span>
            </div>
            {renderActions()}
        </div>
    );
};


// --- Main Tasks Application Component ---
const TasksApplication = () => {
    const { projectId } = useParams();
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    const userRoleInProject = project?.members?.find(m => m.user.id === user.id)?.role;

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [projectRes, tasksRes] = await Promise.all([
                axios.get(`/api/project/${projectId}`),
                axios.get(`/api/task?projectId=${projectId}`)
            ]);
            setProject(projectRes.data);
            setTasks(tasksRes.data);
        } catch (err) {
            setError('Failed to fetch project data. You may not have access to this project.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveTask = async (taskData, taskId) => {
        try {
            if (taskId) {
                const updatePayload = {
                    title: taskData.title,
                    description: taskData.description,
                    assignedToUserId: taskData.assignedToUserId,
                    status: editingTask.status, // Preserve the existing status
                    priority: taskData.priority,
                    dueDate: taskData.dueDate,
                };
                await axios.put(`/api/task/${taskId}`, updatePayload);
            } else {
                // Create a new task
                await axios.post('/api/task', { ...taskData, projectId: parseInt(projectId, 10) });
            }
            fetchData(); // Refresh data
        } catch (err) {
            console.error("Error saving task:", err);
            setError(err.response?.data?.message || "Failed to save the task.");
        }
    };

    const handleUpdateTaskStatus = async (taskId, newStatus) => {
        const taskToUpdate = tasks.find(t => t.id === taskId);
        if (!taskToUpdate) {
            setError("Task not found");
            return;
        }

        // Construct a payload that matches the backend's UpdateTaskRequest DTO
        const updatePayload = {
            title: taskToUpdate.title,
            description: taskToUpdate.description,
            assignedToUserId: taskToUpdate.assignedTo ? taskToUpdate.assignedTo.id : null,
            status: newStatus,
            priority: taskToUpdate.priority,
            dueDate: taskToUpdate.dueDate,
        };

        try {
            await axios.put(`/api/task/${taskId}`, updatePayload);
            fetchData();
        } catch (err) {
            console.error("Error updating task status:", err);
            setError(err.response?.data?.message || "Failed to update task status.");
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            try {
                await axios.delete(`/api/task/${taskId}`);
                fetchData();
            } catch (err) {
                console.error("Error deleting task:", err);
                setError(err.response?.data?.message || "Failed to delete task.");
            }
        }
    };

    const handleOpenModal = (task = null) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    if (loading) return <div className="p-8 flex justify-center items-center h-screen"><Spinner size="h-12 w-12" /></div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!project) return <div className="p-8 text-center">Project not found.</div>;

    const taskColumns = {
        todo: tasks.filter(t => t.status === 0),
        inProgress: tasks.filter(t => t.status === 1),
        inReview: tasks.filter(t => t.status === 2),
        done: tasks.filter(t => t.status === 3),
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm p-4">
                <div className="max-w-screen-xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">{project.name}</h1>
                        <p className="text-sm text-gray-600">{project.description}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <RoleBasedComponent allowedRoles={['Admin', 'ProjectManager']} userRoleInProject={userRoleInProject}>
                            <button onClick={() => handleOpenModal()} className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                                <PlusIcon /> Add New Task
                            </button>
                        </RoleBasedComponent>
                        <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">Back to Dashboard</Link>
                    </div>
                </div>
            </header>

            <main className="p-4 sm:p-6 lg:p-8 max-w-screen-xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* To Do Column */}
                    <div className="bg-gray-200 p-4 rounded-lg">
                        <h3 className="font-bold mb-4">To Do ({taskColumns.todo.length})</h3>
                        <div>{taskColumns.todo.map(task => <TaskCard key={task.id} task={task} userRole={userRoleInProject} onEdit={handleOpenModal} onUpdateStatus={handleUpdateTaskStatus} onDelete={handleDeleteTask} />)}</div>
                    </div>
                    {/* In Progress Column */}
                    <div className="bg-gray-200 p-4 rounded-lg">
                        <h3 className="font-bold mb-4">In Progress ({taskColumns.inProgress.length})</h3>
                        <div>{taskColumns.inProgress.map(task => <TaskCard key={task.id} task={task} userRole={userRoleInProject} onEdit={handleOpenModal} onUpdateStatus={handleUpdateTaskStatus} onDelete={handleDeleteTask} />)}</div>
                    </div>
                    {/* In Review Column */}
                    <div className="bg-gray-200 p-4 rounded-lg">
                        <h3 className="font-bold mb-4">In Review ({taskColumns.inReview.length})</h3>
                        <div>{taskColumns.inReview.map(task => <TaskCard key={task.id} task={task} userRole={userRoleInProject} onEdit={handleOpenModal} onUpdateStatus={handleUpdateTaskStatus} onDelete={handleDeleteTask} />)}</div>
                    </div>
                    {/* Done Column */}
                    <div className="bg-gray-200 p-4 rounded-lg">
                        <h3 className="font-bold mb-4">Done ({taskColumns.done.length})</h3>
                        <div>{taskColumns.done.map(task => <TaskCard key={task.id} task={task} userRole={userRoleInProject} onEdit={handleOpenModal} onUpdateStatus={handleUpdateTaskStatus} onDelete={handleDeleteTask} />)}</div>
                    </div>
                </div>
            </main>

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTask}
                projectMembers={project.members}
                existingTask={editingTask}
            />
        </div>
    );
};

export default TasksApplication;
