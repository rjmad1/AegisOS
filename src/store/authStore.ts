import { create } from "zustand";

export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "operator" | "viewer";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        set({ isLoading: false });
        return false;
      }

      const data = await response.json();
      const { user, token } = data;

      localStorage.setItem("ops_auth_token", token);
      localStorage.setItem("ops_user", JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error) {
      console.error("Login request failed:", error);
      set({ isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("ops_auth_token");
    localStorage.removeItem("ops_user");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initialize: () => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("ops_auth_token");
    const userJson = localStorage.getItem("ops_user");

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      } catch (e) {
        // Corrupted localStorage data
        localStorage.removeItem("ops_auth_token");
        localStorage.removeItem("ops_user");
      }
    }

    set({ isLoading: false });
  },
}));
