import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user on startup if token exists
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const role = localStorage.getItem('role');
                    const name = localStorage.getItem('name');
                    if (role) {
                        setUser({ role, name });
                    }
                } catch (error) {
                    console.error("Auth load error", error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('role');
                    localStorage.removeItem('name');
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await api.post('/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role);
            localStorage.setItem('name', res.data.name);
            setUser({ role: res.data.role, name: res.data.name });
            return { success: true, role: res.data.role };
        } catch (error) {
            console.error("Login failed", error.response?.data);
            return { success: false, error: error.response?.data?.msg || 'Login failed' };
        }
    };

    const loginWithGoogle = async (token) => {
        try {
            const res = await api.post('/google-login', { token });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role);
            localStorage.setItem('name', res.data.name);
            setUser({ role: res.data.role, name: res.data.name });
            return { success: true, role: res.data.role };
        } catch (error) {
            console.error("Google Login failed", error.response?.data);
            return { 
                success: false, 
                error: error.response?.status === 401 ? 'Unauthorized user' : (error.response?.data?.msg || 'Google Login failed') 
            };
        }
    };

    const adminLogin = async (email, password) => {
        try {
            const res = await api.post('/admin/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role);
            localStorage.setItem('name', res.data.name);
            setUser({ role: res.data.role, name: res.data.name });
            return { success: true };
        } catch (error) {
            console.error("Admin Login failed", error.response?.data);
            return { success: false, error: error.response?.data?.msg || 'Admin Login failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        setUser(null);
    };

    const value = {
        user,
        login,
        loginWithGoogle,
        adminLogin,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
