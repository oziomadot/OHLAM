import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Linking, Platform } from 'react-native'; // ← Add Linking
import * as LinkingExpo from 'expo-linking'; // ← For deep link parsing
import API from "@/src/services/api"; 
import { getItem, setItem, deleteItem } from "../app/utils/storage";

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  user: any | null;
  login: (token: string, userData: any) => void;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  handleOramexIntegration: () => void; // ← New: Trigger deep link manually
  showOramexBanner: boolean; // ← New: Banner visibility
  setShowOramexBanner: (show: boolean) => void; // ← New: Control banner visibility
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showOramexBanner, setShowOramexBanner] = useState(true); // ← New: Banner state



  // ← New: Deep link handling for incoming from Oramex
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      if (url.startsWith('oramexgamepro://')) {
        // Parse URL: oramexgamepro://auth?access=...&refresh=...
        const { queryParams } = LinkingExpo.parse(url);
        const accessToken = queryParams?.access;
        const refreshToken = queryParams?.refresh;

        if (accessToken) {
          // Verify OHLAM auth: Try to fetch user with token
          const verifyAuth = async () => {
            try {
              const res = await fetch(`${API.baseURL}/me`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              const data = await res.json();
              setUser(data.user);
              setIsAuthenticated(true);
              await setItem("authToken", typeof accessToken === 'string' ? accessToken : accessToken[0]);
              router.replace("/(tabs)/home");
            } catch (error) {
              // Token invalid → Redirect to login
              console.log("Invalid token from Oramex, redirecting to login");
              router.replace("/auth/LoginScreen");
            }
          };
          verifyAuth();
        }
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check initial URL on app start
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
  const checkAuth = async () => {
    const token = await getItem("authToken");
    console.log("Token:", token);
    const savedUser = await getItem("user");
      if (token) {
        // Set token for API calls
        const tokenHeader = token ? { 'Authorization': `Bearer ${token}` } : {};
        setIsAuthenticated(true);
        if (savedUser) setUser(JSON.parse(savedUser));
      }
    setLoading(false);
  };
  checkAuth();
}, []);


  const forgotPassword = async (email: string) => {
    try {
      const response = await API.request('/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      return response;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  const login = async (token: string, userData: any, refreshToken?: string) => {
  await setItem("authToken", token);
  await setItem("refreshToken", refreshToken || "");
  await setItem("user", JSON.stringify(userData));
  
  // Set token for API calls
  const tokenHeader = token ? { 'Authorization': `Bearer ${token}` } : {};
  
  setUser(userData);
  setIsAuthenticated(true);
  
  // Use setTimeout to ensure navigation happens after the component is mounted
  setTimeout(() => {
    router.replace("/(tabs)/home");
  }, 100);
};

  const logout = async () => {
    try {
      const token = await getItem("authToken");
      if (token) {
        await API.request("/logout", { method: "POST" });
      }
    } catch (error) {
      console.warn("Logout error:", error.response?.data || error.message);
    } finally {
      await deleteItem("authToken");
      setIsAuthenticated(false);
      router.replace("/auth/LoginScreen");
    }
  };

//   async function sendTokensToOramex(accessToken, refreshToken) {
//   const url = `oramexgamepro://auth?access=${encodeURIComponent(accessToken)}&refresh=${encodeURIComponent(refreshToken)}`;
//   try {
//     await Linking.openURL(url);
//   } catch (error) {
//     console.log('Oramex app not installed or cannot open URL:', error);
//   }
// }

// ← New: Manual trigger for Oramex integration
  const handleOramexIntegration = async () => {
    const token = await getItem("authToken");
    const refreshToken = await getItem("refreshToken");
    if (!token) {
      router.replace("/auth/LoginScreen");
      return;
    }

    const url = `oramexgamepro://auth?access=${encodeURIComponent(token)}&refresh=${encodeURIComponent(refreshToken || '')}`;
    
    // Check if Oramex is installed
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      // Installed: Open it
      await Linking.openURL(url);
    } else {
      // Not installed: Show download banner or redirect to store
      const storeUrl = Platform.OS === 'ios' 
        ? 'https://apps.apple.com/app/oramex-game-pro/idYOUR_APP_ID'  // Replace with real App Store ID
        : 'https://play.google.com/store/apps/details?id=com.oramex.gamepro';  // Replace with real Play Store ID
      Linking.openURL(storeUrl);
    }
  };

  // ← New: Check if Oramex is installed (for banner logic)
  const isOramexInstalled = async () => {
    const url = 'oramexgamepro://test';  // Test scheme
    return await Linking.canOpenURL(url);
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



