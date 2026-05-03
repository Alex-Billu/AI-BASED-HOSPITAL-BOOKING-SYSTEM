import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api';
import { initSocket, disconnectSocket } from '../utils/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('emerge_user');
        return stored ? JSON.parse(stored) : null;
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            initSocket(user.id, user.role, user.hospitalId);
        }
        return () => disconnectSocket();
    }, [user]);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const { data } = await API.post('/auth/login', { email, password });
            localStorage.setItem('emerge_token', data.token);
            localStorage.setItem('emerge_user', JSON.stringify(data.user));
            setUser(data.user);
            return { success: true, user: data.user };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Login failed' };
        } finally {
            setLoading(false);
        }
    };

    const register = async (formData) => {
        setLoading(true);
        try {
            const { data } = await API.post('/auth/register', formData);
            localStorage.setItem('emerge_token', data.token);
            localStorage.setItem('emerge_user', JSON.stringify(data.user));
            setUser(data.user);
            return { success: true, user: data.user };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Registration failed' };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('emerge_token');
        localStorage.removeItem('emerge_user');
        setUser(null);
        disconnectSocket();
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
