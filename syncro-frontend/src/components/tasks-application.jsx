// zentoboo/syncro/Syncro-bc266b2d3b44722e8ff4501783c8d62f150e59ee/syncro-frontend/src/components/tasks-application.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useRBAC } from '../hooks/useRBAC';
import { RoleBasedComponent } from './RBACComponents';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';

// --- Helper Components ---
const Spinner = ({ size = 'h-5 w-5' }) => (
    <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 border-indigo-400`}></div>
);

const PlusIcon = () => (
    <svg className="h-6 w-6 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const CommentIcon = () => (
    <svg className="h-5 w-5 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const PaperClipIcon = () => (
    <svg className="h-5 w-5 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
);

const priorityStyles = {
    0: { text: 'Low', bg: 'bg-gray-700', text_color: 'text-gray-200' },
    1: { text: 'Medium', bg: 'bg-blue-900', text_color: 'text-blue-200' },
    2: { text: 'High', bg: 'bg-yellow-900', text_color: 'text-yellow-200' },
    3: { text: 'Critical', bg: 'bg-red-900', text_color: 'text-red-200' }
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
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex justify-center items-center p-4">
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

// --- Submit for Review Modal ---
const SubmitReviewModal = ({ isOpen, onClose, onSubmit, task }) => {
    const [comment, setComment] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit(task.id, { comment, file });
        
        // Reset state for next time
        setLoading(false);
        setComment('');
        setFile(null);
        e.target.reset(); // Resets the file input
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">Submit Task for Review: {task?.title}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Add a comment (optional)</label>
                        <textarea
                            id="comment"
                            placeholder="Describe your work, ask questions, or provide details for the reviewer."
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            className="w-full p-2 border rounded mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            rows="4"
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor="file" className="block text-sm font-medium text-gray-700">Attach a file (optional)</label>
                        <input
                            id="file"
                            type="file"
                            onChange={handleFileChange}
                            className="w-full text-sm text-gray-500 mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400">
                            {loading ? 'Submitting...' : 'Submit for Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Task Card ---
const TaskCard = ({ task, user, userRole, onEdit, onUpdateStatus, onDelete, onOpenReviewModal }) => {

    // Helper function to handle secure file downloads
    const handleDownload = async (attachmentId, fileName) => {
        try {
            const response = await axios.get(`/api/file/download/${attachmentId}`, {
                responseType: 'blob', // This is important to handle binary file data
            });
            // Create a temporary link to trigger the download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Could not download the file.');
        }
    };
    
    const renderActions = () => {
        const isManager = userRole === 'Admin' || userRole === 'ProjectManager';
        // Check if the currently logged-in user is the one assigned to the task
        const isAssignedToMe = user && task.assignedTo?.id === user.id;

        switch (task.status) {
            case 0: // ToDo
                // Only show "Start Task" if the task is assigned to the current user
                if (isAssignedToMe) {
                    return <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(task.id, 1); }} className="w-full mt-2 px-3 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600">Start Task</button>;
                }
                return null;
            case 1: // In Progress
                // Only show "Submit for Review" if the task is assigned to the current user
                if (isAssignedToMe) {
                    return <button onClick={(e) => { e.stopPropagation(); onOpenReviewModal(task); }} className="w-full mt-2 px-3 py-1 text-xs text-white bg-purple-500 rounded hover:bg-purple-600">Submit for Review</button>;                }
                return null;
            case 2: // In Review
                // Only show "Reject" and "Approve" to managers
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
        <div className="bg-slate-700 p-4 rounded-lg shadow-md border border-slate-600 mb-4" >
            <div className="flex justify-between items-start cursor-pointer" onClick={() => onEdit(task)}>
                <h4 className="font-semibold text-white">{task.title}</h4>
                <RoleBasedComponent allowedRoles={['Admin', 'ProjectManager']} userRoleInProject={userRole}>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="text-gray-400 hover:text-red-500"><TrashIcon /></button>
                </RoleBasedComponent>
            </div>
            {task.description && <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">{task.description}</p>}
            <div className="flex justify-between items-center mt-3 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs ${priorityStyles[task.priority].bg} ${priorityStyles[task.priority].text_color}`}>
                    {priorityStyles[task.priority].text}
                </span>
                <span className="text-gray-400">{task.assignedTo?.username || 'Unassigned'}</span>
            </div>
            
            {/* Display Comments */}
            {task.comments && task.comments.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-600">
                    <h5 className="text-xs font-bold text-gray-400 mb-2 flex items-center"><CommentIcon /> Latest Comment</h5>
                    <div className="text-sm bg-slate-800 p-3 rounded-md">
                        <p className="whitespace-pre-wrap break-words text-gray-200">{task.comments[0].content}</p>
                        <p className="text-right text-gray-500 mt-1">- {task.comments[0].user.username}</p>
                    </div>
                </div>
            )}
            
            {/* Display Attachments */}
            {task.attachments && task.attachments.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-600">
                     <h5 className="text-xs font-bold text-gray-400 mb-2 flex items-center"><PaperClipIcon /> Attachments</h5>
                    <ul className="space-y-2">
                        {task.attachments.map(att => (
                            <li key={att.id}>
                                <button onClick={() => handleDownload(att.id, att.fileName)} className="text-sm text-indigo-400 hover:underline hover:text-indigo-300 text-left break-all">
                                    {att.fileName}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {renderActions()}
        </div>
    );
};


// --- Main Tasks Application Component ---
const TasksApplication = () => {
    const { projectId } = useParams();
    const { user } = useAuth();
    const { updateProjectInfo } = useBreadcrumb();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewingTask, setReviewingTask] = useState(null);

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
            updateProjectInfo(projectId, projectRes.data.name);
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

    const handleOpenReviewModal = (task) => {
        setReviewingTask(task);
        setIsReviewModalOpen(true);
    };

    const handleSubmitForReview = async (taskId, { comment, file }) => {
        setError('');
        try {
            // 1. Upload file if one was selected
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                await axios.post(`/api/file/upload/${taskId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            // 2. Add comment if one was provided
            if (comment.trim()) {
                await axios.post(`/api/task/${taskId}/comments`, { content: comment });
            }

            // 3. Update the task status to "In Review"
            const taskToUpdate = tasks.find(t => t.id === taskId);
            if (taskToUpdate) {
                const updatePayload = {
                    title: taskToUpdate.title,
                    description: taskToUpdate.description,
                    assignedToUserId: taskToUpdate.assignedTo ? taskToUpdate.assignedTo.id : null,
                    status: 2, // In Review status
                    priority: taskToUpdate.priority,
                    dueDate: taskToUpdate.dueDate,
                };
                await axios.put(`/api/task/${taskId}`, updatePayload);
            } else {
                 throw new Error("Task not found, cannot update status.");
            }

            fetchData(); // Refresh all data on success
        } catch (err) {
            console.error("Failed to submit for review:", err);
            setError(err.response?.data?.message || err.message || "Failed to submit for review.");
            setLoading(false); // Ensure loading is turned off on error
        } finally {
            // Close the modal regardless of outcome
            setIsReviewModalOpen(false);
            setReviewingTask(null);
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

    if (loading) return <div className="p-8 flex justify-center items-center h-screen bg-slate-900"><Spinner size="h-16 w-16" /></div>;
    if (error) return <div className="p-8 text-center text-red-400 bg-slate-900">{error}</div>;
    if (!project) return <div className="p-8 text-center bg-slate-900">Project not found.</div>;

    const taskColumns = {
        todo: tasks.filter(t => t.status === 0),
        inProgress: tasks.filter(t => t.status === 1),
        inReview: tasks.filter(t => t.status === 2),
        done: tasks.filter(t => t.status === 3),
    };

    return (
        <div className="min-h-screen bg-slate-900 text-gray-200">
            <header className="bg-slate-800 shadow-lg p-6">
                <div className="max-w-screen-xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-white">{project.name}</h1>
                        <p className="text-lg text-gray-400 mt-1">{project.description}</p>
                    </div>
                    <div className="flex items-center space-x-6">
                        <RoleBasedComponent allowedRoles={['Admin', 'ProjectManager']} userRoleInProject={userRoleInProject}>
                            <button onClick={() => handleOpenModal()} className="flex items-center justify-center px-6 py-3 text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                                <PlusIcon /> Add New Task
                            </button>
                        </RoleBasedComponent>
                        <Link to="/dashboard" className="text-base text-indigo-400 hover:underline">Back to Dashboard</Link>
                    </div>
                </div>
            </header>

            <main className="p-4 sm:p-6 lg:p-8 max-w-screen-xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* To Do Column */}
                    <div className="bg-slate-800 p-5 rounded-xl">
                        <h3 className="font-bold text-xl mb-4 text-gray-200">To Do ({taskColumns.todo.length})</h3>
                        <div className="space-y-4">{taskColumns.todo.map(task => <TaskCard key={task.id} task={task} user={user} userRole={userRoleInProject} onEdit={handleOpenModal} onUpdateStatus={handleUpdateTaskStatus} onDelete={handleDeleteTask} />)}</div>
                    </div>
                    {/* In Progress Column */}
                    <div className="bg-slate-800 p-5 rounded-xl">
                        <h3 className="font-bold text-xl mb-4 text-gray-200">In Progress ({taskColumns.inProgress.length})</h3>
                        <div className="space-y-4">{taskColumns.inProgress.map(task => <TaskCard key={task.id} task={task} user={user} userRole={userRoleInProject} onEdit={handleOpenModal} onUpdateStatus={handleUpdateTaskStatus} onDelete={handleDeleteTask} onOpenReviewModal={handleOpenReviewModal} />)}</div>
                    </div>
                    {/* In Review Column */}
                    <div className="bg-slate-800 p-5 rounded-xl">
                        <h3 className="font-bold text-xl mb-4 text-gray-200">In Review ({taskColumns.inReview.length})</h3>
                        <div className="space-y-4">{taskColumns.inReview.map(task => <TaskCard key={task.id} task={task} user={user} userRole={userRoleInProject} onEdit={handleOpenModal} onUpdateStatus={handleUpdateTaskStatus} onDelete={handleDeleteTask} onOpenReviewModal={handleOpenReviewModal} />)}</div>
                    </div>
                    {/* Done Column */}
                    <div className="bg-slate-800 p-5 rounded-xl">
                        <h3 className="font-bold text-xl mb-4 text-gray-200">Done ({taskColumns.done.length})</h3>
                        <div className="space-y-4">{taskColumns.done.map(task => <TaskCard key={task.id} task={task} user={user} userRole={userRoleInProject} onEdit={handleOpenModal} onUpdateStatus={handleUpdateTaskStatus} onDelete={handleDeleteTask} onOpenReviewModal={handleOpenReviewModal} />)}</div>
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
            <SubmitReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                onSubmit={handleSubmitForReview}
                task={reviewingTask}
            />
        </div>
    );
};

export default TasksApplication;