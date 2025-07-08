// src/hooks/useRBAC.js
import { useAuth } from '../contexts/AuthContext';

export const useRBAC = () => {
    const { user } = useAuth();

    const isAdmin = () => {
        return user?.role === 'Admin';
    };

    const isProjectManager = () => {
        return user?.role === 'ProjectManager';
    };

    const isContributor = () => {
        return user?.role === 'Contributor';
    };

    const canManageUsers = () => {
        return isAdmin();
    };

    const canCreateProject = () => {
        return isAdmin() || isProjectManager();
    };

    const canManageProject = (userRoleInProject) => {
        // Check if user can manage a specific project based on their role in that project
        return isAdmin() || userRoleInProject === 'Admin' || userRoleInProject === 'ProjectManager';
    };

    const canInviteMembers = (userRoleInProject) => {
        return isAdmin() || userRoleInProject === 'Admin' || userRoleInProject === 'ProjectManager';
    };

    const canRemoveMembers = (userRoleInProject) => {
        return isAdmin() || userRoleInProject === 'Admin';
    };

    const canDeleteProject = (userRoleInProject, isProjectCreator = false) => {
        return isAdmin() || (userRoleInProject === 'Admin' && isProjectCreator);
    };

    const canCreateTasks = (userRoleInProject) => {
        // All project members can create tasks
        return userRoleInProject !== null;
    };

    const canAssignTasks = (userRoleInProject) => {
        return isAdmin() || userRoleInProject === 'Admin' || userRoleInProject === 'ProjectManager';
    };

    const canDeleteTasks = (userRoleInProject, isTaskCreator = false) => {
        return isAdmin() || userRoleInProject === 'Admin' || userRoleInProject === 'ProjectManager' || isTaskCreator;
    };

    const canViewProject = (userRoleInProject) => {
        // Users can only see projects they're members of
        return userRoleInProject !== null;
    };

    const getMaxRole = () => {
        if (isAdmin()) return 'Admin';
        if (isProjectManager()) return 'ProjectManager';
        return 'Contributor';
    };

    // Enhanced permission functions for user management
    const canPromoteUser = (targetUserRole = null) => {
        // Only admins can change user roles
        // Cannot change admin users' roles
        return isAdmin() && targetUserRole !== 'Admin';
    };

    const canBanUser = (targetUserRole = null) => {
        // Only admins can ban users
        // Cannot ban other admin users
        return isAdmin() && targetUserRole !== 'Admin';
    };

    const canUnbanUser = () => {
        // Only admins can unban users
        return isAdmin();
    };

    // Check if a role change is valid (only ProjectManager and Contributor allowed)
    const isValidRoleChange = (newRole) => {
        const allowedRoles = ['ProjectManager', 'Contributor'];
        return allowedRoles.includes(newRole);
    };

    // Check if user can search for other users
    const canSearchUsers = () => {
        return isAdmin() || isProjectManager();
    };

    return {
        user,
        isAdmin,
        isProjectManager,
        isContributor,
        canManageUsers,
        canCreateProject,
        canManageProject,
        canInviteMembers,
        canRemoveMembers,
        canDeleteProject,
        canCreateTasks,
        canAssignTasks,
        canDeleteTasks,
        canViewProject,
        canPromoteUser,
        canBanUser,
        canUnbanUser,
        canSearchUsers,
        isValidRoleChange,
        getMaxRole
    };
};