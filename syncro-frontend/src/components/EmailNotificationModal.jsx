import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmailNotificationModal = ({ isOpen, onClose, task, projectMembers }) => {
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (task) {
            setRecipient(task.assignedTo?.email || '');
            setSubject(`Regarding Task: ${task.title}`);
            setBody(`Hi,\n\nThis is a notification regarding the task "${task.title}".\n\nDescription: ${task.description}\n\nPlease review the details.\n\nThanks`);
        }
    }, [task]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await axios.post('/api/notification/send-email', {
                to: recipient,
                subject,
                body,
            });
            setSuccess('Email sent successfully!');
            setTimeout(() => {
                onClose();
                setSuccess('');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send email.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-700">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Send Email Notification</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="recipient" className="block text-sm font-medium text-slate-300 mb-2">Recipient</label>
                        <select
                            id="recipient"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Select a recipient</option>
                            {projectMembers.map(member => (
                                <option key={member.user.id} value={member.user.email}>
                                    {member.user.username} ({member.user.email})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                        <input
                            id="subject"
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        />
                    </div>
                    <div>
                        <label htmlFor="body" className="block text-sm font-medium text-slate-300 mb-2">Body</label>
                        <textarea
                            id="body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows="6"
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        ></textarea>
                    </div>
                    {error && <p className="text-red-400">{error}</p>}
                    {success && <p className="text-green-400">{success}</p>}
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-slate-600 text-slate-200 rounded-lg">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-3 bg-indigo-600 text-white rounded-lg">
                            {loading ? 'Sending...' : 'Send Email'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmailNotificationModal;