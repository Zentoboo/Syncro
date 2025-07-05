// src/contexts/BreadcrumbContext.jsx
import React, { createContext, useContext, useState } from 'react';

const BreadcrumbContext = createContext();

export const BreadcrumbProvider = ({ children }) => {
    const [projectInfo, setProjectInfo] = useState({});

    const updateProjectInfo = (projectId, projectName) => {
        setProjectInfo(prev => ({
            ...prev,
            [projectId]: projectName
        }));
    };

    const getProjectName = (projectId) => {
        return projectInfo[projectId] || null;
    };

    return (
        <BreadcrumbContext.Provider value={{
            updateProjectInfo,
            getProjectName
        }}>
            {children}
        </BreadcrumbContext.Provider>
    );
};

export const useBreadcrumb = () => {
    const context = useContext(BreadcrumbContext);
    if (!context) {
        throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
    }
    return context;
};