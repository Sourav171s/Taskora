import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  age?: number;
  gender?: string;
  bio?: string;
  phone?: string;
  location?: string;
  occupation?: string;
  dateOfBirth?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => void;
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

import api from "@/lib/api";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("taskora_token"));
  const [isLoading, setIsLoading] = useState(true);

  // On mount, verify existing token
  useEffect(() => {
    const savedToken = localStorage.getItem("taskora_token");
    if (savedToken) {
      api.get("/user/me")
        .then((res) => {
          if (res.data.success) {
            setUser(res.data.user);
            setToken(savedToken);
          } else {
            localStorage.removeItem("taskora_token");
            setToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem("taskora_token");
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  // Handle Google OAuth callback token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleToken = params.get("token");
    if (googleToken) {
      localStorage.setItem("taskora_token", googleToken);
      setToken(googleToken);
      window.history.replaceState({}, "", window.location.pathname);
      api.get("/user/me")
        .then((res) => {
          if (res.data.success) setUser(res.data.user);
        });
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/user/login", { email, password });
    const data = res.data;
    if (!data.success) throw new Error(data.message || "Login failed");
    localStorage.setItem("taskora_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post("/user/register", { name, email, password });
    const data = res.data;
    if (!data.success) throw new Error(data.message || "Registration failed");
    localStorage.setItem("taskora_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const loginWithGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api"}/user/auth/google`;
  };

  const logout = () => {
    localStorage.removeItem("taskora_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, loginWithGoogle, logout, isLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
