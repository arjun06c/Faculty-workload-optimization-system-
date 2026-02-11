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
                    // Assuming we have a route to get current user. For now, rely on role stored or decode token?
                    // Better to fetch user profile. 
                    // Let's implement a verify endpoint or just decode if we stick to basic JWT.
                    // But for security, let's fetch profile based on role.
                    // Wait, we don't have a generic /api/auth/me. 
                    // Admin has no profile fetch, only faculty.
                    // Let's decode the token payload if possible, or just store role in localStorage for now (less secure but faster for prototype).
                    // Actually, let's just proceed with what we have. API calls will fail if token invalid.

                    // Decode token manually or trust localStorage for role until an API call fails.
                    const role = localStorage.getItem('role');
                    if (role) {
                        setUser({ role });
                    }
                } catch (error) {
                    console.error("Auth load error", error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('role');
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role);
            setUser({ role: res.data.role });
            return { success: true };
        } catch (error) {
            console.error("Login failed", error.response?.data);
            return { success: false, error: error.response?.data?.msg || 'Login failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setUser(null);
    };

    const value = {
        user,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
