import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header'; // Import the shared Header

const About = () => {
    const { user } = useAuth();

    // Section Icon Component  
    const SectionIcon = () => (
        <div className="w-4 h-4 bg-indigo-500 rounded-sm mr-3 flex-shrink-0"></div>
    );

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            {/* Use the shared Header component */}
            <Header />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-slate-800 shadow-xl rounded-lg p-8 sm:p-10 lg:p-12 border border-slate-700">
                    {/* Hero Section */}
                    <section className="mb-10 text-center">
                        <h2 className="text-4xl font-bold text-white mb-6 flex items-center justify-center">
                            <SectionIcon />
                            What is Syncro?
                        </h2>
                        <div className="space-y-4 max-w-4xl mx-auto">
                            <p className="text-lg leading-relaxed text-slate-200">
                                Syncro is a comprehensive and intuitive web-based application meticulously designed to empower teams and individuals in efficiently managing their projects from conception to completion. In today's dynamic work environment, keeping track of tasks, coordinating team efforts, and maintaining clear communication can be challenging.
                            </p>
                            <p className="text-lg leading-relaxed text-slate-200">
                                Syncro addresses these complexities by providing a centralized platform where all aspects of project management are streamlined and accessible. Whether you're a small team or a larger organization, Syncro provides the tools necessary to enhance productivity, minimize miscommunication, and ensure that every project stays on track.
                            </p>
                        </div>
                    </section>

                    <hr className="my-12 border-slate-600" />

                    {/* Roles Section */}
                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center">
                            <SectionIcon />
                            User Roles in Syncro
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Admin Role */}
                            <div className="bg-slate-700 rounded-xl p-8 border border-slate-600 hover:border-red-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/20">
                                <div className="flex justify-center mb-4">
                                    <div className="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center">
                                        <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-semibold text-red-400 mb-4 text-center">Admin</h3>
                                <div className="space-y-3">
                                    <p className="text-center text-slate-300">
                                        <span className="font-medium text-red-300">Overview:</span> Has the highest level of access and control over the entire system.
                                    </p>
                                    <div className="bg-slate-800 p-4 rounded-lg">
                                        <p className="text-sm text-slate-300 mb-2">
                                            <span className="font-medium text-red-300">Key Responsibilities:</span>
                                        </p>
                                        <ul className="text-sm text-slate-400 space-y-1">
                                            <li>• User management and role assignments</li>
                                            <li>• System configurations and settings</li>
                                            <li>• Overseeing all projects across the platform</li>
                                            <li>• Managing global permissions and security</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Project Manager Role */}
                            <div className="bg-slate-700 rounded-xl p-8 border border-slate-600 hover:border-sky-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-sky-500/20">
                                <div className="flex justify-center mb-4">
                                    <div className="w-16 h-16 bg-sky-900 rounded-full flex items-center justify-center">
                                        <svg className="h-8 w-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-semibold text-sky-400 mb-4 text-center">Project Manager</h3>
                                <div className="space-y-3">
                                    <p className="text-center text-slate-300">
                                        <span className="font-medium text-sky-300">Overview:</span> Leads and oversees specific projects with comprehensive management capabilities.
                                    </p>
                                    <div className="bg-slate-800 p-4 rounded-lg">
                                        <p className="text-sm text-slate-300 mb-2">
                                            <span className="font-medium text-sky-300">Key Responsibilities:</span>
                                        </p>
                                        <ul className="text-sm text-slate-400 space-y-1">
                                            <li>• Creating and managing projects</li>
                                            <li>• Managing team members and roles</li>
                                            <li>• Assigning and reviewing tasks</li>
                                            <li>• Monitoring project progress and deadlines</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Contributor Role */}
                            <div className="bg-slate-700 rounded-xl p-8 border border-slate-600 hover:border-emerald-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20">
                                <div className="flex justify-center mb-4">
                                    <div className="w-16 h-16 bg-emerald-900 rounded-full flex items-center justify-center">
                                        <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-semibold text-emerald-400 mb-4 text-center">Contributor</h3>
                                <div className="space-y-3">
                                    <p className="text-center text-slate-300">
                                        <span className="font-medium text-emerald-300">Overview:</span> Actively works on tasks within assigned projects and collaborates with the team.
                                    </p>
                                    <div className="bg-slate-800 p-4 rounded-lg">
                                        <p className="text-sm text-slate-300 mb-2">
                                            <span className="font-medium text-emerald-300">Key Responsibilities:</span>
                                        </p>
                                        <ul className="text-sm text-slate-400 space-y-1">
                                            <li>• Working on assigned tasks</li>
                                            <li>• Updating task statuses and progress</li>
                                            <li>• Submitting work for review</li>
                                            <li>• Collaborating through comments and files</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <hr className="my-12 border-slate-600" />

                    {/* Task Flow Section */}
                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-6 flex items-center justify-center">
                            <SectionIcon />
                            How Task Flow Works in Syncro
                        </h2>
                        <div className="bg-slate-700 rounded-xl p-8 border border-slate-600">
                            <p className="mb-8 leading-relaxed text-slate-200 text-center text-lg">
                                Tasks are the fundamental units of work in Syncro, designed to move through a clear lifecycle for efficient tracking and completion.
                            </p>
                            
                            {/* Task Flow Steps */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
                                    <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-white font-bold">1</span>
                                    </div>
                                    <h4 className="text-lg font-semibold text-slate-200 text-center mb-2">To Do</h4>
                                    <p className="text-sm text-slate-400 text-center">Tasks that haven't been started yet</p>
                                </div>
                                
                                <div className="bg-slate-800 rounded-lg p-6 border border-blue-600">
                                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-white font-bold">2</span>
                                    </div>
                                    <h4 className="text-lg font-semibold text-blue-300 text-center mb-2">In Progress</h4>
                                    <p className="text-sm text-slate-400 text-center">Tasks actively being worked on</p>
                                </div>
                                
                                <div className="bg-slate-800 rounded-lg p-6 border border-purple-600">
                                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-white font-bold">3</span>
                                    </div>
                                    <h4 className="text-lg font-semibold text-purple-300 text-center mb-2">In Review</h4>
                                    <p className="text-sm text-slate-400 text-center">Tasks submitted for feedback or approval</p>
                                </div>
                                
                                <div className="bg-slate-800 rounded-lg p-6 border border-green-600">
                                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-white font-bold">4</span>
                                    </div>
                                    <h4 className="text-lg font-semibold text-green-300 text-center mb-2">Done</h4>
                                    <p className="text-sm text-slate-400 text-center">Completed and approved tasks</p>
                                </div>
                            </div>

                            <div className="space-y-4 text-slate-200">
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <p><span className="font-semibold text-indigo-300">Task Creation:</span> Tasks are created within projects to outline specific goals and deliverables.</p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <p><span className="font-semibold text-indigo-300">Assignment & Prioritization:</span> Tasks are assigned to team members with priority levels (Low, Medium, High, Critical).</p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <p><span className="font-semibold text-indigo-300">Progress Tracking:</span> Team members update task status as work progresses through the workflow.</p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <p><span className="font-semibold text-indigo-300">Collaboration:</span> Members can add comments, attach files, and mention colleagues for seamless communication.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <hr className="my-12 border-slate-600" />

                    {/* Key Features Section */}
                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center">
                            <SectionIcon />
                            Key Features & Capabilities
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4">
                                    <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div>
                                        <h4 className="font-semibold text-indigo-300 mb-1">Interactive Dashboard</h4>
                                        <p className="text-slate-400">Comprehensive overview of projects, tasks, and real-time notifications in one centralized location.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div>
                                        <h4 className="font-semibold text-indigo-300 mb-1">Real-time Notifications System</h4>
                                        <p className="text-slate-400">Instant updates for task assignments, status changes, and team communications.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div>
                                        <h4 className="font-semibold text-indigo-300 mb-1">Advanced Project Management</h4>
                                        <p className="text-slate-400">Create projects, manage team members, and track progress with detailed analytics.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div>
                                        <h4 className="font-semibold text-indigo-300 mb-1">File Management System</h4>
                                        <p className="text-slate-400">Secure file uploads, downloads, and attachment management for all project assets.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4">
                                    <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div>
                                        <h4 className="font-semibold text-indigo-300 mb-1">Integrated Calendar View</h4>
                                        <p className="text-slate-400">Visualize tasks with due dates across multiple view modes (Month, Week, Day, List).</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div>
                                        <h4 className="font-semibold text-indigo-300 mb-1">Team Collaboration Tools</h4>
                                        <p className="text-slate-400">Comment systems with @mentions, file sharing, and real-time project updates.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div>
                                        <h4 className="font-semibold text-indigo-300 mb-1">Role-based Security</h4>
                                        <p className="text-slate-400">Comprehensive authentication and authorization system with granular permission controls.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div>
                                        <h4 className="font-semibold text-indigo-300 mb-1">Performance Analytics</h4>
                                        <p className="text-slate-400">Detailed insights on team performance, project progress, and productivity metrics.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <hr className="my-12 border-slate-600" />

                    {/* Technology Section */}
                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center">
                            <SectionIcon />
                            Technology Stack
                        </h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-slate-700 rounded-xl p-8 border border-slate-600 hover:border-blue-400 transition-colors">
                                <div className="flex items-center mb-4">
                                    <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                                        <svg className="h-6 w-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2L2 7v10c0 5.55 3.84 9.75 9 9.75s9-4.2 9-9.75V7l-10-5z"/>
                                        </svg>
                                    </div>
                                    <h4 className="text-xl font-semibold text-blue-400">Frontend</h4>
                                </div>
                                <p className="text-slate-200 mb-4">
                                    Built with modern <span className="font-bold text-blue-400">React</span> and advanced JavaScript, 
                                    providing a dynamic, responsive, and intuitive user interface.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm">React</span>
                                    <span className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm">JavaScript</span>
                                    <span className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm">Tailwind CSS</span>
                                </div>
                            </div>
                            <div className="bg-slate-700 rounded-xl p-8 border border-slate-600 hover:border-purple-400 transition-colors">
                                <div className="flex items-center mb-4">
                                    <div className="w-12 h-12 bg-purple-900 rounded-lg flex items-center justify-center mr-4">
                                        <svg className="h-6 w-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                        </svg>
                                    </div>
                                    <h4 className="text-xl font-semibold text-purple-400">Backend</h4>
                                </div>
                                <p className="text-slate-200 mb-4">
                                    Powered by robust <span className="font-bold text-purple-400">ASP.NET Core</span> framework, 
                                    ensuring secure, efficient server-side logic and RESTful APIs.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-purple-900 text-purple-200 rounded-full text-sm">ASP.NET Core</span>
                                    <span className="px-3 py-1 bg-purple-900 text-purple-200 rounded-full text-sm">C#</span>
                                    <span className="px-3 py-1 bg-purple-900 text-purple-200 rounded-full text-sm">Entity Framework</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Call to Action */}
                    <div className="text-center mt-12 p-8 bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl border border-indigo-700">
                        <p className="text-xl text-indigo-200 mb-6">Ready to streamline your project management with Syncro?</p>
                        <Link 
                            to="/dashboard" 
                            className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white text-lg font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-indigo-500/25"
                        >
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default About;