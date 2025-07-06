// src/components/Breadcrumb.jsx
import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { useAuth } from '../contexts/AuthContext';

// Simple SVG icons
const ChevronRightIcon = () => (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const Breadcrumb = () => {
    const location = useLocation();
    const params = useParams();
    const { getProjectName } = useBreadcrumb();
    const { user } = useAuth();
    
    // Don't show breadcrumb on login/register pages
    if (['/login', '/register', '/unauthorized'].includes(location.pathname)) {
        return null;
    }

    // Auto-generate breadcrumbs based on current path
    const generateBreadcrumbs = () => {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        const breadcrumbs = [];

        // Always start with Dashboard
        breadcrumbs.push({
            label: 'Dashboard',
            href: '/dashboard'
        });

        // Handle different page types
        if (pathSegments.includes('admin')) {
            breadcrumbs.push({
                label: 'Admin Panel',
                href: null // Current page
            });
        }

        // Handle notifications page
        if (pathSegments.includes('notifications')) {
            breadcrumbs.push({
                label: user?.username || 'User',
                href: null
            });
            breadcrumbs.push({
                label: 'Notifications',
                href: null
            });
        }

        // Check for project pages - use path segments directly
        if (pathSegments.includes('project') && pathSegments.length >= 2) {
            // Extract project ID from path segments
            const projectIndex = pathSegments.indexOf('project');
            const projectId = pathSegments[projectIndex + 1];
            
            // Get project name from context
            const projectName = getProjectName(projectId);
            
            // Add project name if available (no link - you're already in the project)
            breadcrumbs.push({
                label: projectName || `Project ${projectId}`,
                href: null // Don't link to tasks when you're in the project
            });

            // Add specific project page
            if (pathSegments.includes('tasks')) {
                breadcrumbs.push({
                    label: 'Tasks',
                    href: null // Current page
                });
            } else if (pathSegments.includes('contributors')) {
                breadcrumbs.push({
                    label: 'Contributors',
                    href: null // Current page
                });
            } else if (pathSegments.includes('members')) {
                breadcrumbs.push({
                    label: 'Members',
                    href: null // Current page
                });
            } else if (pathSegments.includes('settings')) {
                breadcrumbs.push({
                    label: 'Settings',
                    href: null // Current page
                });
            }
        }

        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();

    // Don't show breadcrumb if only dashboard
    if (breadcrumbs.length <= 1 && location.pathname === '/dashboard') {
        return null;
    }

    return (
        <div className="bg-gray-50 border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <nav className="flex items-center space-x-2 text-sm text-gray-500">
                    {breadcrumbs.map((breadcrumb, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && <ChevronRightIcon />}
                            
                            {breadcrumb.href ? (
                                <Link 
                                    to={breadcrumb.href} 
                                    className="hover:text-blue-600 transition-colors"
                                >
                                    <span>{breadcrumb.label}</span>
                                </Link>
                            ) : (
                                <span className="text-gray-900 font-medium">
                                    <span>{breadcrumb.label}</span>
                                </span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>
            </div>
        </div>
    );
};

export default Breadcrumb;