import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';

// Helper Components
const Spinner = ({ size = 'h-5 w-5' }) => (
    <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 border-indigo-400`}></div>
);

const PriorityBadge = ({ priority }) => {
    const priorityStyles = {
        0: { bg: 'bg-gray-700', text: 'text-gray-200', label: 'Low' },
        1: { bg: 'bg-blue-900', text: 'text-blue-200', label: 'Medium' },
        2: { bg: 'bg-yellow-900', text: 'text-yellow-200', label: 'High' },
        3: { bg: 'bg-red-900', text: 'text-red-200', label: 'Critical' }
    };
    
    const style = priorityStyles[priority] || priorityStyles[1];
    
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
            {style.label}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const statusStyles = {
        0: { bg: 'bg-slate-700', text: 'text-slate-200', label: 'To Do' },
        1: { bg: 'bg-blue-700', text: 'text-blue-200', label: 'In Progress' },
        2: { bg: 'bg-purple-700', text: 'text-purple-200', label: 'In Review' },
        3: { bg: 'bg-green-700', text: 'text-green-200', label: 'Done' }
    };
    
    const style = statusStyles[status] || statusStyles[0];
    
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
            {style.label}
        </span>
    );
};

// File Upload Component
const FileUpload = ({ taskId, onFileUploaded }) => {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileUpload = async (files) => {
        if (!files || files.length === 0) return;
        
        setUploading(true);
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                
                await axios.post(`/api/file/upload/${taskId}`, formData);
            }
            onFileUploaded();
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        handleFileUpload(files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    return (
        <div className="mb-6">
            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragOver 
                        ? 'border-indigo-500 bg-indigo-900/20' 
                        : 'border-slate-600 hover:border-slate-500'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                    className="hidden"
                />
                
                {uploading ? (
                    <div className="flex items-center justify-center space-x-2">
                        <Spinner />
                        <span className="text-slate-400">Uploading...</span>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <svg className="h-12 w-12 text-slate-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-slate-300">Drop files here or click to upload</p>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
                        >
                            Choose Files
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// File List Component
const FileList = ({ files, onFileDeleted }) => {
    const { user } = useAuth();

    const handleDownload = async (attachmentId, fileName) => {
        try {
            const response = await axios.get(`/api/file/download/${attachmentId}`, {
                responseType: 'blob',
            });
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

    const handleDelete = async (attachmentId, fileName) => {
        if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
            try {
                await axios.delete(`/api/file/${attachmentId}`);
                onFileDeleted();
            } catch (error) {
                console.error('Error deleting file:', error);
                alert('Failed to delete file.');
            }
        }
    };

    const getFileIcon = (contentType) => {
        if (contentType?.includes('image')) return '🖼️';
        if (contentType?.includes('pdf')) return '📄';
        if (contentType?.includes('word')) return '📝';
        if (contentType?.includes('excel') || contentType?.includes('spreadsheet')) return '📊';
        return '📎';
    };

    if (!files || files.length === 0) {
        return (
            <div className="text-center py-6 text-slate-500">
                <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No files attached to this task</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getFileIcon(file.contentType)}</span>
                        <div>
                            <p className="text-white font-medium">{file.fileName}</p>
                            <p className="text-sm text-slate-400">
                                Uploaded by {file.uploadedBy.username} • {new Date(file.uploadedAt).toLocaleDateString()}
                                {file.fileSize && (
                                    <span> • {(file.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handleDownload(file.id, file.fileName)}
                            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-600 rounded-md transition-colors"
                            title="Download"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </button>
                        {(file.uploadedBy.id === user.id) && (
                            <button
                                onClick={() => handleDelete(file.id, file.fileName)}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded-md transition-colors"
                                title="Delete"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Enhanced Comment Component with @mentions
const CommentEditor = ({ onSubmit, projectMembers, placeholder = "Add a comment..." }) => {
    const [content, setContent] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionPosition, setMentionPosition] = useState(0);
    const [loading, setLoading] = useState(false);
    const textareaRef = useRef(null);

    const handleContentChange = (e) => {
        const value = e.target.value;
        const cursorPosition = e.target.selectionStart;
        
        setContent(value);
        
        // Check for @ mentions
        const beforeCursor = value.substring(0, cursorPosition);
        const mentionMatch = beforeCursor.match(/@(\w*)$/);
        
        if (mentionMatch) {
            setShowMentions(true);
            setMentionQuery(mentionMatch[1]);
            setMentionPosition(cursorPosition);
        } else {
            setShowMentions(false);
            setMentionQuery('');
        }
    };

    const insertMention = (username) => {
        const beforeMention = content.substring(0, mentionPosition - mentionQuery.length - 1);
        const afterMention = content.substring(mentionPosition);
        const newContent = beforeMention + `@${username} ` + afterMention;
        
        setContent(newContent);
        setShowMentions(false);
        setMentionQuery('');
        
        // Focus back to textarea
        setTimeout(() => {
            if (textareaRef.current) {
                const newPosition = beforeMention.length + username.length + 2;
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newPosition, newPosition);
            }
        }, 0);
    };

    const handleSubmit = async () => {
        if (!content.trim()) return;
        
        setLoading(true);
        try {
            await onSubmit(content);
            setContent('');
            setShowMentions(false);
        } catch (error) {
            console.error('Error submitting comment:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMembers = projectMembers.filter(member =>
        member.user.username.toLowerCase().includes(mentionQuery.toLowerCase())
    );

    return (
        <div className="relative">
            <div className="flex space-x-3">
                <div className="flex-1">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        placeholder={placeholder}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                        rows="3"
                    />
                    
                    {/* Mention Dropdown */}
                    {showMentions && filteredMembers.length > 0 && (
                        <div className="absolute z-10 mt-1 w-64 bg-slate-700 border border-slate-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {filteredMembers.map((member) => (
                                <button
                                    key={member.user.id}
                                    onClick={() => insertMention(member.user.username)}
                                    className="w-full px-4 py-2 text-left hover:bg-slate-600 flex items-center space-x-2 transition-colors"
                                >
                                    <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                        {member.user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-white">{member.user.username}</span>
                                    <span className="text-slate-400 text-sm">({member.role})</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                
                <button
                    onClick={handleSubmit}
                    disabled={!content.trim() || loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                    {loading ? <Spinner size="h-4 w-4" /> : 'Post'}
                </button>
            </div>
            
            <div className="mt-2 text-xs text-slate-500">
                Type @ to mention team members
            </div>
        </div>
    );
};

// Comment Display Component
const CommentList = ({ comments }) => {
    const renderCommentContent = (content) => {
        // Replace @mentions with styled spans
        const parts = content.split(/(@\w+)/g);
        return parts.map((part, index) => {
            if (part.startsWith('@')) {
                return (
                    <span key={index} className="text-indigo-400 font-medium">
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    if (!comments || comments.length === 0) {
        return (
            <div className="text-center py-6 text-slate-500">
                <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>No comments yet. Be the first to comment!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {comment.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <div className="bg-slate-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-white font-medium">{comment.user.username}</h4>
                                <time className="text-slate-400 text-sm">
                                    {new Date(comment.createdAt).toLocaleString()}
                                </time>
                            </div>
                            <p className="text-slate-200 whitespace-pre-wrap">
                                {renderCommentContent(comment.content)}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Task Actions Component
const TaskActions = ({ task, userRole, currentUser, onStatusUpdate, onSubmitForReview }) => {
    const isAssignedToMe = task.assignedTo?.id === currentUser.id;
    const isManager = userRole === 'Admin' || userRole === 'ProjectManager';

    const getAvailableActions = () => {
        const actions = [];

        switch (task.status) {
            case 0: // ToDo
                if (isAssignedToMe) {
                    actions.push({
                        label: 'Start Task',
                        action: () => onStatusUpdate(1),
                        className: 'bg-blue-600 hover:bg-blue-700',
                        icon: (
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-10V7a3 3 0 00-3-3H6a3 3 0 00-3 3v1M5 10h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                            </svg>
                        )
                    });
                }
                break;

            case 1: // In Progress
                if (isAssignedToMe) {
                    actions.push({
                        label: 'Submit for Review',
                        action: onSubmitForReview,
                        className: 'bg-purple-600 hover:bg-purple-700',
                        icon: (
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        )
                    });
                }
                break;

            case 2: // In Review
                if (isManager) {
                    actions.push(
                        {
                            label: 'Approve Task',
                            action: () => onStatusUpdate(3),
                            className: 'bg-green-600 hover:bg-green-700',
                            icon: (
                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )
                        },
                        {
                            label: 'Request Changes',
                            action: () => onStatusUpdate(1),
                            className: 'bg-yellow-600 hover:bg-yellow-700',
                            icon: (
                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            )
                        }
                    );
                }
                break;

            case 3: // Done
                // No actions available for completed tasks
                break;
        }

        return actions;
    };

    const actions = getAvailableActions();

    if (actions.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-3">
            {actions.map((action, index) => (
                <button
                    key={index}
                    onClick={action.action}
                    className={`inline-flex items-center px-4 py-2 text-white font-medium rounded-lg transition-colors ${action.className}`}
                >
                    {action.icon}
                    {action.label}
                </button>
            ))}
        </div>
    );
};

// Main Task Detail Component
const TaskDetail = () => {
    const { projectId, taskId } = useParams();
    const { user } = useAuth();
    const { updateProjectInfo } = useBreadcrumb();
    const navigate = useNavigate();
    
    const [task, setTask] = useState(null);
    const [project, setProject] = useState(null);
    const [comments, setComments] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const userRoleInProject = project?.members?.find(m => m.user.id === user.id)?.role;

    const fetchTaskData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [taskRes, projectRes, attachmentsRes] = await Promise.all([
                axios.get(`/api/task/${taskId}`),
                axios.get(`/api/project/${projectId}`),
                axios.get(`/api/file/task/${taskId}/attachments`)
            ]);
            
            setTask(taskRes.data);
            setProject(projectRes.data);
            setComments(taskRes.data.comments || []);
            setAttachments(attachmentsRes.data);
            
            updateProjectInfo(projectId, projectRes.data.name);
        } catch (err) {
            setError('Failed to fetch task data. You may not have access to this task.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [taskId, projectId]); // Removed updateProjectInfo from dependencies

    useEffect(() => {
        fetchTaskData();
    }, [taskId, projectId]); // Only depend on taskId and projectId

    const handleAddComment = async (content) => {
        try {
            await axios.post(`/api/task/${taskId}/comments`, { content });
            // Refresh task data to get updated comments
            const taskRes = await axios.get(`/api/task/${taskId}`);
            setComments(taskRes.data.comments || []);
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            const updatePayload = {
                title: task.title,
                description: task.description,
                assignedToUserId: task.assignedTo?.id || null,
                status: newStatus,
                priority: task.priority,
                dueDate: task.dueDate,
            };
            
            await axios.put(`/api/task/${taskId}`, updatePayload);
            
            // Refresh task data
            const taskRes = await axios.get(`/api/task/${taskId}`);
            setTask(taskRes.data);
        } catch (error) {
            console.error('Error updating task status:', error);
            alert('Failed to update task status');
        }
    };

    const handleSubmitForReview = async () => {
        try {
            await handleStatusUpdate(2); // Set status to In Review
        } catch (error) {
            console.error('Error submitting for review:', error);
        }
    };

    const handleFileUploaded = async () => {
        try {
            const response = await axios.get(`/api/file/task/${taskId}/attachments`);
            setAttachments(response.data);
        } catch (error) {
            console.error('Error refreshing attachments:', error);
        }
    };

    const handleFileDeleted = async () => {
        try {
            const response = await axios.get(`/api/file/task/${taskId}/attachments`);
            setAttachments(response.data);
        } catch (error) {
            console.error('Error refreshing attachments:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Spinner size="h-12 w-12" />
                    <p className="mt-4 text-slate-400">Loading task details...</p>
                </div>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-900 bg-opacity-50">
                        <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-medium text-white mb-2">Task Not Found</h2>
                    <p className="text-slate-400 mb-4">{error || 'This task does not exist or you do not have access to it.'}</p>
                    <Link
                        to={`/project/${projectId}/tasks`}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        Back to Tasks
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            {/* Header */}
            <header className="bg-slate-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link
                                to={`/project/${projectId}/tasks`}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-white">{task.title}</h1>
                                <p className="text-slate-400 mt-1">
                                    {project?.name} • Task #{task.id}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <StatusBadge status={task.status} />
                            <PriorityBadge priority={task.priority} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Task Details and Comments */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Task Information */}
                        <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                            <h2 className="text-xl font-semibold text-white mb-4">Task Details</h2>
                            
                            {task.description && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-slate-300 mb-2">Description</h3>
                                    <p className="text-slate-200 whitespace-pre-wrap bg-slate-700 p-4 rounded-lg">
                                        {task.description}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-medium text-slate-300 mb-2">Assigned To</h3>
                                    {task.assignedTo ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                {task.assignedTo.username.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-white">{task.assignedTo.username}</span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">Unassigned</span>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-slate-300 mb-2">Due Date</h3>
                                    {task.dueDate ? (
                                        <span className="text-white">
                                            {new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400">No due date</span>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-slate-300 mb-2">Created By</h3>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                            {task.createdBy.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-white">{task.createdBy.username}</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-slate-300 mb-2">Created</h3>
                                    <span className="text-white">
                                        {new Date(task.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Task Actions */}
                        <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                            <h2 className="text-xl font-semibold text-white mb-4">Actions</h2>
                            <TaskActions
                                task={task}
                                userRole={userRoleInProject}
                                currentUser={user}
                                onStatusUpdate={handleStatusUpdate}
                                onSubmitForReview={handleSubmitForReview}
                            />
                        </div>

                        {/* File Attachments */}
                        <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                            <h2 className="text-xl font-semibold text-white mb-4">File Attachments</h2>
                            
                            <FileUpload
                                taskId={task.id}
                                onFileUploaded={handleFileUploaded}
                            />
                            
                            <FileList
                                files={attachments}
                                onFileDeleted={handleFileDeleted}
                            />
                        </div>

                        {/* Comments Section */}
                        <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                            <h2 className="text-xl font-semibold text-white mb-6">
                                Comments ({comments.length})
                            </h2>
                            
                            {/* Comment Editor */}
                            <div className="mb-8">
                                <CommentEditor
                                    onSubmit={handleAddComment}
                                    projectMembers={project?.members || []}
                                    placeholder="Add a comment... Use @ to mention team members"
                                />
                            </div>
                            
                            {/* Comments List */}
                            <CommentList comments={comments} />
                        </div>
                    </div>

                    {/* Right Column - Task Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Info */}
                        <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                            <h3 className="text-lg font-semibold text-white mb-4">Quick Info</h3>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Status</span>
                                    <StatusBadge status={task.status} />
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Priority</span>
                                    <PriorityBadge priority={task.priority} />
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Comments</span>
                                    <span className="text-white font-medium">{comments.length}</span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Attachments</span>
                                    <span className="text-white font-medium">{attachments.length}</span>
                                </div>
                                
                                {task.updatedAt && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Last Updated</span>
                                        <span className="text-white text-sm">
                                            {new Date(task.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Project Info */}
                        <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                            <h3 className="text-lg font-semibold text-white mb-4">Project</h3>
                            
                            <div className="space-y-3">
                                <div>
                                    <h4 className="text-white font-medium">{project?.name}</h4>
                                    {project?.description && (
                                        <p className="text-slate-400 text-sm mt-1">{project.description}</p>
                                    )}
                                </div>
                                
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Team Members</span>
                                    <span className="text-white">{project?.members?.length || 0}</span>
                                </div>
                                
                                <div className="pt-3 border-t border-slate-700">
                                    <Link
                                        to={`/project/${projectId}/tasks`}
                                        className="inline-flex items-center text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
                                    >
                                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        Back to All Tasks
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetail;