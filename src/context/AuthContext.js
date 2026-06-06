import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    async function checkAuth() {
        try {
            const token = await SecureStore.getItemAsync('auth_token');
            if (token) {
                const data = await api.request('/user');
                setUser(data);
            }
        } catch (error) {
            await api.removeToken();
        } finally {
            setLoading(false);
        }
    }

    async function login(email, password) {
        const data = await api.login(email, password);
        setUser(data.user);
        return data;
    }

    async function register(userData) {
        const data = await api.register(userData);
        setUser(data.user);
        return data;
    }

    async function logout() {
        await api.logout();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );

    async function completeKycLogin(data) {
        await SecureStore.setItemAsync("auth_token", data.token);
        await api.setToken?.(data.token);
        setUser(data.user);
        return data;
    }
}

export function useAuth() {
    return useContext(AuthContext);
}
