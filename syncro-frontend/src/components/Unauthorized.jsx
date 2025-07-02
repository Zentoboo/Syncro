import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full text-center">
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100">
                    <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                
                <h2 className="mt-6 text-2xl font-bold text-gray-900">Access Denied</h2>
                
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                    <p className="text-gray-600">
                        You don't have permission to access this page.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Your current role: <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                            user?.role === 'Admin' ? 'bg-red-100 text-red-800' :
                            user?.role === 'ProjectManager' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                        }`}>
                            {user?.role || 'Unknown'}
                        </span>
                    </p>
                </div>
                
                <div className="mt-6 space-y-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                    >
                        Go to Dashboard
                    </button>
                    
                    <button
                        onClick={() => window.history.back()}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                    >
                        Go Back
                    </button>
                </div>
                
                <div className="mt-8 text-xs text-gray-400">
                    <p>If you believe this is an error, please contact your administrator.</p>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;