// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create context
const AuthContext = createContext(null);

// AuthProvider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Configure axios defaults
    useEffect(() => {
        // Update the API base URL to match your backend
        axios.defaults.baseURL = 'http://localhost:5095'; // Change to your API URL

        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // Check if user is logged in on app start
    useEffect(() => {
        const initializeAuth = async () => {
            const savedToken = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            if (savedToken && savedUser) {
                setToken(savedToken);
                // The user object with the ID will now be correctly loaded from localStorage
                setUser(JSON.parse(savedUser));
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await axios.post('/api/auth/login', {
                username,
                password
            });

            // Destructure the new userId from the response
            const { token: newToken, userId, username: userName, role } = response.data;
            
            // Create a complete user object
            const userPayload = { id: userId, username: userName, role };

            // Save to localStorage and state
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(userPayload));
            setToken(newToken);
            setUser(userPayload);
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            return { success: true };
        } catch (error) {
            console.error('❌ Login error:', error);
            console.error('📄 Error response:', error.response?.data);
            console.error('🔢 Error status:', error.response?.status);

            return {
                success: false,
                error: error.response?.data || error.message || 'Login failed'
            };
        }
    };

    const register = async (username, email, password) => {
        try {
            const response = await axios.post('/api/auth/register', {
                username,
                email,
                password
            });

            // Destructure the new userId from the response
            const { token: newToken, userId, username: userName, role } = response.data;
            
            // Create a complete user object
            const userPayload = { id: userId, username: userName, role };

            // Save to localStorage and state
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(userPayload));
            setToken(newToken);
            setUser(userPayload);
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            return { success: true };

        } catch (error) {
            console.error('❌ Registration error:', error);
            console.error('📄 Error response:', error.response?.data);
            console.error('🔢 Error status:', error.response?.status);

            return {
                success: false,
                error: error.response?.data || error.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    const hasRole = (requiredRole) => {
        return user?.role === requiredRole;
    };

    const isAuthenticated = () => {
        return !!token && !!user;
    };

    const value = {
        user,
        token,
        login,
        register,
        logout,
        hasRole,
        isAuthenticated,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook - exported as a separate component
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}