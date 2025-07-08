import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useRBAC } from '../hooks/useRBAC';
import { RoleBasedComponent } from './RBACComponents';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import EmailNotificationModal from './EmailNotificationModal'; 

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

const EmailIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
        };
        await onSave(taskData, existingTask ? existingTask.id : null);
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-700">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        {existingTask ? 'Edit Task Details' : 'Create New Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Task Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
                            Task Title *
                        </label>
                        <input
                            id="title"
                            type="text"
                            placeholder="Enter task title..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {/* Task Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            placeholder="Enter task description..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                            rows="4"
                        ></textarea>
                    </div>

                    {/* Assignment and Due Date Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Assign To */}
                        <div>
                            <label htmlFor="assignedTo" className="block text-sm font-medium text-slate-300 mb-2">
                                Assign to
                            </label>
                            <select
                                id="assignedTo"
                                value={assignedToUserId}
                                onChange={e => setAssignedToUserId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            >
                                <option value="">Select team member...</option>
                                {projectMembers.map(member => (
                                    <option key={member.user.id} value={member.user.id}>
                                        {member.user.username} ({member.role})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Due Date */}
                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-slate-300 mb-2">
                                Due Date
                            </label>
                            <input
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-slate-300 mb-2">
                            Priority
                        </label>
                        <select
                            id="priority"
                            value={priority}
                            onChange={e => setPriority(parseInt(e.target.value, 10))}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        >
                            <option value="0">Low Priority</option>
                            <option value="1">Medium Priority</option>
                            <option value="2">High Priority</option>
                            <option value="3">Critical Priority</option>
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-slate-600 text-slate-200 font-medium rounded-lg hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                existingTask ? 'Update Task' : 'Create Task'
                            )}
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
        <div className="fixed inset-0 bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-700">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        Submit Task for Review
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Task Info */}
                <div className="mb-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <h3 className="text-lg font-medium text-white mb-2">Task: {task?.title}</h3>
                    <p className="text-sm text-slate-400">
                        Ready to submit your work for review? Add any comments or files below.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Comment Section */}
                    <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-slate-300 mb-2">
                            Add a comment (optional)
                        </label>
                        <textarea
                            id="comment"
                            placeholder="Describe your work, ask questions, or provide details for the reviewer..."
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                            rows="4"
                        ></textarea>
                    </div>

                    {/* File Upload Section */}
                    <div>
                        <label htmlFor="file" className="block text-sm font-medium text-slate-300 mb-2">
                            Attach a file (optional)
                        </label>
                        <div className="relative">
                            <input
                                id="file"
                                type="file"
                                onChange={handleFileChange}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                            />
                        </div>
                        {file && (
                            <div className="mt-2 p-3 bg-slate-700 rounded-lg border border-slate-600">
                                <div className="flex items-center space-x-2">
                                    <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    <span className="text-sm text-slate-300">{file.name}</span>
                                    <span className="text-xs text-slate-500">
                                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Help Text */}
                    <div className="p-4 bg-purple-900 bg-opacity-30 border border-purple-700 rounded-lg">
                        <div className="flex items-start space-x-3">
                            <svg className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-sm text-purple-300 mb-1">
                                    <strong>What happens next?</strong>
                                </p>
                                <ul className="text-sm text-purple-200 space-y-1">
                                    <li>• Your task will be moved to "In Review" status</li>
                                    <li>• Project managers will be notified to review your work</li>
                                    <li>• They can approve it or send it back for changes</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-slate-600 text-slate-200 font-medium rounded-lg hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Submitting...
                                </>
                            ) : (
                                'Submit for Review'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Task Card ---
const TaskCard = ({ task, user, userRole, onEdit, onUpdateStatus, onDelete, onOpenReviewModal, onOpenEmailModal, projectId }) => {
    const navigate = useNavigate();

    const handleCardClick = (e) => {
        // Don't navigate if clicking on action buttons
        if (e.target.closest('button')) {
            return;
        }
        navigate(`/project/${projectId}/task/${task.id}`);
    };

    const renderActions = () => {
        const isManager = userRole === 'Admin' || userRole === 'ProjectManager';
        const isAssignedToMe = user && task.assignedTo?.id === user.id;

        switch (task.status) {
            case 0: // ToDo
                if (isAssignedToMe) {
                    return (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpdateStatus(task.id, 1);
                            }}
                            className="w-full mt-2 px-3 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
                        >
                            Start Task
                        </button>
                    );
                }
                return null;
            case 1: // In Progress
                if (isAssignedToMe) {
                    return (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenReviewModal(task);
                            }}
                            className="w-full mt-2 px-3 py-1 text-xs text-white bg-purple-500 rounded hover:bg-purple-600 transition-colors"
                        >
                            Submit for Review
                        </button>
                    );
                }
                return null;
            case 2: // In Review
                if (isManager) {
                    return (
                        <div className="flex space-x-2 mt-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStatus(task.id, 1);
                                }}
                                className="w-full px-3 py-1 text-xs text-white bg-yellow-500 rounded hover:bg-yellow-600 transition-colors"
                            >
                                Reject
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStatus(task.id, 3);
                                }}
                                className="w-full px-3 py-1 text-xs text-white bg-green-500 rounded hover:bg-green-600 transition-colors"
                            >
                                Approve
                            </button>
                        </div>
                    );
                }
                return null;
            default: // Done
                return null;
        }
    };

    return (
        <div
            className="bg-slate-700 p-4 rounded-lg shadow-md border border-slate-600 mb-4 cursor-pointer hover:bg-slate-600 transition-colors"
            onClick={handleCardClick}
        >
            <div className="flex justify-between items-start">
                <h4 className="font-semibold text-white hover:text-indigo-300 transition-colors">
                    {task.title}
                </h4>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenEmailModal(task);
                        }}
                        className="text-gray-400 hover:text-blue-500 transition-colors p-1 hover:bg-slate-800 rounded"
                        title="Send Email Notification"
                    >
                        <EmailIcon />
                    </button>
                    <RoleBasedComponent allowedRoles={['Admin', 'ProjectManager']} userRoleInProject={userRole}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(task.id);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-slate-800 rounded"
                            title="Delete Task"
                        >
                            <TrashIcon />
                        </button>
                    </RoleBasedComponent>
                </div>
            </div>

            {task.description && (
                <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap line-clamp-2">
                    {task.description}
                </p>
            )}

            <div className="flex justify-between items-center mt-3 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs ${priorityStyles[task.priority].bg} ${priorityStyles[task.priority].text_color}`}>
                    {priorityStyles[task.priority].text}
                </span>
                <span className="text-gray-400">{task.assignedTo?.username || 'Unassigned'}</span>
            </div>

            {/* Activity Summary */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-3">
                    {task.comments && task.comments.length > 0 && (
                        <div className="flex items-center space-x-1">
                            <CommentIcon />
                            <span>{task.comments.length}</span>
                        </div>
                    )}
                    {task.attachments && task.attachments.length > 0 && (
                        <div className="flex items-center space-x-1">
                            <PaperClipIcon />
                            <span>{task.attachments.length}</span>
                        </div>
                    )}
                </div>
                <span className="text-xs text-slate-500">
                    Click to view details
                </span>
            </div>

            {/* Display Latest Comment Preview */}
            {task.comments && task.comments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-600">
                    <div className="text-xs bg-slate-800 p-2 rounded">
                        <p className="text-gray-300 truncate">
                            <span className="font-medium">{task.comments[0].user.username}:</span> {task.comments[0].content}
                        </p>
                    </div>
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
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailTask, setEmailTask] = useState(null);

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
    }, [projectId, updateProjectInfo]);

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

    const handleOpenEmailModal = (task) => {
        setEmailTask(task);
        setIsEmailModalOpen(true);
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
                        <div className="space-y-4">{taskColumns.todo.map(task => <TaskCard key={task.id} task={task} user={user} userRole={userRoleInProject} onEdit={handleOpenModal} onUpdateStatus={handleUpdateTaskStatus} onDelete={handleDeleteTask} onOpenEmailModal={handleOpenEmailModal} projectId={projectId} />)}</div>
                    </div>
                    {/* In Progress Column */}
                    <div className="bg-slate-800 p-5 rounded-xl">
                        <h3 className="font-bold text-xl mb-4 text-gray-200">In Progress ({taskColumns.inProgress.length})</h3>
                        <div className="space-y-4">{taskColumns.inProgress.map(task => <TaskCard key={task.id} task={task} user={user} userRole={userRoleInProject} onEdit={handleOpenModal} onUpdateStatus={handleUpdateTaskStatus} onDelete={handleDeleteTask} onOpenReviewModal={handleOpenReviewModal} onOpenEmailModal={handleOpenEmailModal} projectId={projectId} />)}</div>
                    </div>
                    {/* In Review Column */}
                    <div className="bg-slate-800 p-5 rounded-xl">
                        <h3 className="font-bold text-xl mb-4 text-gray-200">In Review ({taskColumns.inReview.length})</h3>
                        <div className="space-y-4">{taskColumns.inReview.map(task => <TaskCard key={task.id} task={task} user={user} userRole={userRoleInProject} onEdit={handleOpenModal} onUpdateStatus={handleUpdateTaskStatus} onDelete={handleDeleteTask} onOpenReviewModal={handleOpenReviewModal} onOpenEmailModal={handleOpenEmailModal} projectId={projectId} />)}</div>
                    </div>
                    {/* Done Column */}
                    <div className="bg-slate-800 p-5 rounded-xl">
                        <h3 className="font-bold text-xl mb-4 text-gray-200">Done ({taskColumns.done.length})</h3>
                        <div className="space-y-4">{taskColumns.done.map(task => <TaskCard key={task.id} task={task} user={user} userRole={userRoleInProject} onEdit={handleOpenModal} onUpdateStatus={handleUpdateTaskStatus} onDelete={handleDeleteTask} onOpenReviewModal={handleOpenReviewModal} onOpenEmailModal={handleOpenEmailModal} projectId={projectId} />)}</div>
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
            {project && emailTask && (
                <EmailNotificationModal
                    isOpen={isEmailModalOpen}
                    onClose={() => setIsEmailModalOpen(false)}
                    task={emailTask}
                    projectMembers={project.members}
                />
            )}
        </div>
    );
};

export default TasksApplication;