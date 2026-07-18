import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Linking, Platform } from 'react-native'; 
import * as LinkingExpo from 'expo-linking'; 
import API from "@/src/services/api"; 
import { getItem, setItem, deleteItem } from "../app/utils/storage";

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  user: any | null;
  login: (token: string, userData: any, refreshToken?: string) => void;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  handleOramexIntegration: () => void;
  showOramexBanner: boolean;
  setShowOramexBanner: (show: boolean) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showOramexBanner, setShowOramexBanner] = useState(true);

  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      if (url.startsWith('oramexgamepro://')) {
        const { queryParams } = LinkingExpo.parse(url);
        const accessToken = queryParams?.access;
        const refreshToken = queryParams?.refresh;

        if (accessToken) {
          const verifyAuth = async () => {
            try {
              const tokenStr = typeof accessToken === 'string' ? accessToken : accessToken[0];
              const res = await API.get('/me', {
                headers: { Authorization: `Bearer ${tokenStr}` }
              });
              const data = res.data;
              setUser(data.user);
              setIsAuthenticated(true);
              await API.setToken(tokenStr);
              if (refreshToken) {
                await setItem("refreshToken", typeof refreshToken === 'string' ? refreshToken : refreshToken[0]);
              }
              router.replace("/(tabs)/home");
            } catch (error) {
              console.log("Invalid token from Oramex, redirecting to login");
              router.replace("/auth/LoginScreen");
            }
          };
          verifyAuth();
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await API.getToken();
      const savedUser = await getItem("user");
      if (token) {
        setIsAuthenticated(true);
        if (savedUser) setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const forgotPassword = async (email: string) => {
    try {
      await API.forgetpassword(email);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  const login = async (token: string, userData: any, refreshToken?: string) => {
    await API.setToken(token);
    if (refreshToken) await setItem("refreshToken", refreshToken);
    await setItem("user", JSON.stringify(userData));
    
    setUser(userData);
    setIsAuthenticated(true);
    
    setTimeout(() => {
      router.replace("/(tabs)/home");
    }, 100);
  };

  const logout = async () => {
    try {
      await API.logout();
    } catch (error) {
      console.warn("Logout error:", error);
    } finally {
      await deleteItem("user");
      await deleteItem("refreshToken");
      setIsAuthenticated(false);
      router.replace("/auth/LoginScreen");
    }
  };

  const handleOramexIntegration = async () => {
    const token = await API.getToken();
    const refreshToken = await getItem("refreshToken");
    if (!token) {
      router.replace("/auth/LoginScreen");
      return;
    }

    const url = `oramexgamepro://auth?access=${encodeURIComponent(token)}&refresh=${encodeURIComponent(refreshToken || '')}`;
    
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      const storeUrl = Platform.OS === 'ios' 
        ? 'https://apps.apple.com/app/oramex-game-pro/idYOUR_APP_ID'
        : 'https://play.google.com/store/apps/details?id=com.oramex.gamepro';
      Linking.openURL(storeUrl);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      loading, 
      user, 
      login, 
      logout, 
      forgotPassword, 
      handleOramexIntegration,
      showOramexBanner,
      setShowOramexBanner }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
