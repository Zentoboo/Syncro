// src/components/PageLayout.jsx
import React from 'react';
import Breadcrumb from './Breadcrumb';

const PageLayout = ({ 
    children, 
    title = null, 
    subtitle = null, 
    projectName = null, 
    customBreadcrumbs = null,
    headerActions = null,
    showBreadcrumb = true 
}) => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb Section */}
            {showBreadcrumb && <Breadcrumb projectName={projectName} customItems={customBreadcrumbs} />}
            
            {/* Header Section (Optional) */}
            {(title || headerActions) && (
                <header className="bg-white shadow-sm border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                {title && <h1 className="text-3xl font-bold text-gray-900">{title}</h1>}
                                {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
                            </div>
                            {headerActions && (
                                <div className="flex items-center space-x-4">
                                    {headerActions}
                                </div>
                            )}
                        </div>
                    </div>
                </header>
            )}
            
            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
};

export default PageLayout;