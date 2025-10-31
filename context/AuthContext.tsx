import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import API from "@/config/index"; 

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
 user: any | null; // 👈 add this
  login: (token: string, userData: any) => void; // 👈 pass user info
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [user, setUser] = useState(null);



  useEffect(() => {
  const checkAuth = async () => {
    const token = await AsyncStorage.getItem("token");
    const savedUser = await AsyncStorage.getItem("user");
    if (token) {
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setIsAuthenticated(true);
      if (savedUser) setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  };
  checkAuth();
}, []);


 const login = async (token: string, userData: any) => {
  await AsyncStorage.setItem("token", token);
  await AsyncStorage.setItem("user", JSON.stringify(userData));
  
  API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  
  setUser(userData);
  setIsAuthenticated(true);
  router.push("/(tabs)/home");
};

  const logout = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        await API.post("/logout", {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.warn("Logout error:", error.response?.data || error.message);
    } finally {
      await AsyncStorage.removeItem("token");
      delete API.defaults.headers.common["Authorization"];
      setIsAuthenticated(false);
      router.replace("/auth/LoginScreen");
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, user, login, logout }}>
  {children}
</AuthContext.Provider>

  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};



