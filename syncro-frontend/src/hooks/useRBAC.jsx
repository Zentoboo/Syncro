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

    const canPromoteUser = (targetUserRole) => {
        // Only admins can change user roles
        return isAdmin();
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
        getMaxRole
    };
};