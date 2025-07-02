import React from 'react';
import { useRBAC } from '../hooks/useRBAC';

// Component that only renders children if user has required role
export const RoleBasedComponent = ({ 
    allowedRoles = [], 
    userRoleInProject = null, 
    fallback = null, 
    children 
}) => {
    const { user } = useRBAC();
    
    // Check global role
    const hasGlobalRole = allowedRoles.includes(user?.role);
    
    // Check project-specific role
    const hasProjectRole = userRoleInProject && allowedRoles.includes(userRoleInProject);
    
    if (hasGlobalRole || hasProjectRole) {
        return children;
    }
    
    return fallback;
};

// Component for admin-only content
export const AdminOnly = ({ children, fallback = null }) => {
    const { isAdmin } = useRBAC();
    return isAdmin() ? children : fallback;
};

// Component for project manager and admin content
export const ManagerAndAbove = ({ children, fallback = null, userRoleInProject = null }) => {
    const { isAdmin, isProjectManager } = useRBAC();
    const hasProjectManagerRole = userRoleInProject === 'ProjectManager' || userRoleInProject === 'Admin';
    
    return (isAdmin() || isProjectManager() || hasProjectManagerRole) ? children : fallback;
};

// Component that shows different content based on role
export const RoleBasedContent = ({ 
    adminContent = null, 
    managerContent = null, 
    contributorContent = null,
    userRoleInProject = null 
}) => {
    const { isAdmin, isProjectManager } = useRBAC();
    const projectRole = userRoleInProject;
    
    // Prioritize project role over global role
    if (projectRole === 'Admin' || isAdmin()) {
        return adminContent;
    }
    
    if (projectRole === 'ProjectManager' || isProjectManager()) {
        return managerContent;
    }
    
    return contributorContent;
};

// Button component with role-based visibility
export const RoleBasedButton = ({ 
    onClick, 
    children, 
    allowedRoles = [], 
    userRoleInProject = null,
    className = "",
    disabled = false,
    ...props 
}) => {
    const { user } = useRBAC();
    
    const hasGlobalRole = allowedRoles.includes(user?.role);
    const hasProjectRole = userRoleInProject && allowedRoles.includes(userRoleInProject);
    
    if (!hasGlobalRole && !hasProjectRole) {
        return null;
    }
    
    return (
        <button
            onClick={onClick}
            className={className}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

// Navigation item with role-based visibility
export const RoleBasedNavItem = ({ 
    to, 
    children, 
    allowedRoles = [], 
    userRoleInProject = null,
    className = "" 
}) => {
    const { user } = useRBAC();
    
    const hasGlobalRole = allowedRoles.includes(user?.role);
    const hasProjectRole = userRoleInProject && allowedRoles.includes(userRoleInProject);
    
    if (!hasGlobalRole && !hasProjectRole) {
        return null;
    }
    
    return (
        <a href={to} className={className}>
            {children}
        </a>
    );
};