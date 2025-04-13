import React, { createContext, useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export interface User {
  id: number;
  username: string;
  fullName: string;
  department: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  isLoading: boolean;
}

export interface RegisterData {
  username: string;
  password: string;
  fullName: string;
  email: string;
  department: string;
  role: string;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  isLoading: true,
});

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Check if user is logged in
    const checkAuthStatus = async () => {
      try {
        const res = await apiRequest("GET", "/api/auth/user");

        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        console.error("Error checking auth status:", error);
        // If unauthorized, that's expected for logged out users
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await apiRequest("POST", "/api/auth/login", {
        username,
        password,
      });

      const data = await res.json();
      setUser(data.user);
      
      toast({
        title: "Success",
        description: "You have been logged in successfully.",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Invalid username or password.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      setUser(null);
      
      toast({
        title: "Success",
        description: "You have been logged out successfully.",
      });
      
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const res = await apiRequest("POST", "/api/auth/register", userData);
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created. You can now log in.",
      });
      
      navigate("/auth");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
