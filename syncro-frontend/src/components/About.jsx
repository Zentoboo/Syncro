import React from 'react';
import PageLayout from './PageLayout';

const About = () => {
    return (
        <PageLayout title="About Syncro" subtitle="Learn more about our project management application">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="bg-slate-800 shadow-xl rounded-lg p-8 sm:p-10 lg:p-12 border border-slate-700 text-slate-200">
                    <section className="mb-10 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">What is Syncro?</h2>
                        <p className="mb-4 leading-relaxed max-w-3xl mx-auto">
                            Syncro is a comprehensive and intuitive web-based application meticulously designed to empower teams and individuals in efficiently managing their projects from conception to completion. In today's dynamic work environment, keeping track of tasks, coordinating team efforts, and maintaining clear communication can be challenging. Syncro addresses these complexities by providing a centralized platform where all aspects of project management are streamlined and accessible.
                        </p>
                        <p className="leading-relaxed max-w-3xl mx-auto">
                            At its core, Syncro serves as a digital workspace where projects can be created, tasks defined, and progress monitored with ease. It's built to foster seamless collaboration, allowing team members to understand their roles, track their assignments, and contribute effectively to shared goals. Whether you're a small team or a larger organization, Syncro provides the tools necessary to enhance productivity, minimize miscommunication, and ensure that every project stays on track and within scope.
                        </p>
                    </section>

                    <hr className="my-12 border-slate-600" />

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-8 text-center">Roles</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-700 rounded-lg p-6 border border-slate-600 hover:border-indigo-400 transition-colors transform hover:scale-105">
                                <div className="flex justify-center mb-2">
                                    <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-semibold text-indigo-400 mb-3 text-center">Admin</h3>
                                <p className="mb-3 text-center">
                                    <span className="font-medium">Overview:</span> Has the highest level of access and control over the entire system.
                                </p>
                                <p className="text-center">
                                    <span className="font-medium">Key Responsibilities:</span> User management, system configurations, overseeing all projects.
                                </p>
                            </div>
                            <div className="bg-slate-700 rounded-lg p-6 border border-slate-600 hover:border-sky-400 transition-colors transform hover:scale-105">
                                <div className="flex justify-center mb-2">
                                    <svg className="h-6 w-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h4l3 10 4-18h4" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-semibold text-sky-400 mb-3 text-center">Project Manager</h3>
                                <p className="mb-3 text-center">
                                    <span className="font-medium">Overview:</span> Leads and oversees specific projects.
                                </p>
                                <p className="text-center">
                                    <span className="font-medium">Key Responsibilities:</span> Creating projects, managing members, assigning tasks, reviewing submissions.
                                </p>
                            </div>
                            <div className="bg-slate-700 rounded-lg p-6 border border-slate-600 hover:border-emerald-400 transition-colors transform hover:scale-105">
                                <div className="flex justify-center mb-2">
                                    <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-semibold text-emerald-400 mb-3 text-center">Project Contributor</h3>
                                <p className="mb-3 text-center">
                                    <span className="font-medium">Overview:</span> Actively works on tasks within assigned projects.
                                </p>
                                <p className="text-center">
                                    <span className="font-medium">Key Responsibilities:</span> Creating tasks, updating statuses, submitting for review.
                                </p>
                            </div>
                        </div>
                    </section>

                    <hr className="my-12 border-slate-600" />

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">How Tasks Flow Works in Syncro</h2>
                        <p className="mb-6 leading-relaxed">
                            Tasks are the fundamental units of work in Syncro, designed to move through a clear lifecycle for efficient tracking and completion.
                        </p>
                        <ul className="list-disc list-inside space-y-3 pl-4">
                            <li>
                                <span className="font-semibold">Task Creation:</span> Tasks are created within projects to outline specific goals.
                            </li>
                            <li>
                                <span className="font-semibold">Assignment & Prioritization:</span> Tasks are assigned to members and prioritized.
                            </li>
                            <li>
                                <span className="font-semibold">Status Tracking:</span> Tasks move through these statuses:
                                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                    <li><strong>To Do</strong>: Not yet started.</li>
                                    <li><strong>In Progress</strong>: Actively being worked on.</li>
                                    <li><strong>In Review</strong>: Submitted for feedback or approval.</li>
                                    <li><strong>Done</strong>: Completed tasks.</li>
                                </ul>
                            </li>
                            <li>
                                <span className="font-semibold">Collaboration:</span> Members can update details, comment, and attach files.
                            </li>
                        </ul>
                    </section>

                    <hr className="my-12 border-slate-600" />

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">Other Key Features</h2>
                        <ul className="list-disc list-inside space-y-3 pl-4">
                            <li><span className="font-semibold">Interactive Dashboard:</span> Overview of projects, tasks, and alerts.</li>
                            <li><span className="font-semibold">Notifications System:</span> Real-time updates for tasks, assignments, and comments.</li>
                            <li><span className="font-semibold">Project Members Management:</span> Easily manage member roles and access.</li>
                            <li><span className="font-semibold">Contributor Performance Overview:</span> Insights on member contributions.</li>
                            <li><span className="font-semibold">Integrated Calendar:</span> Visualize tasks with due dates.</li>
                            <li><span className="font-semibold">Secure Authentication & Authorization:</span> Role-based access control for security.</li>
                        </ul>
                    </section>

                    <hr className="my-12 border-slate-600" />

                    <section>
                        <h2 className="text-3xl font-bold text-white mb-4">Technology Behind Syncro</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-lg font-semibold text-blue-400">Frontend</h4>
                                <p className="text-slate-200">
                                    Built with <span className="font-bold text-blue-400">React</span>, providing a dynamic and responsive user interface.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-purple-400">Backend</h4>
                                <p className="text-slate-200">
                                    Powered by <span className="font-bold text-purple-400">ASP.NET Core</span> for secure, efficient server-side logic and APIs.
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="text-center mt-12">
                        <p className="text-lg text-slate-300 mb-4">Ready to start managing your projects with Syncro?</p>
                        <a href="/dashboard" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition">
                            Go to Dashboard
                        </a>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default About;
