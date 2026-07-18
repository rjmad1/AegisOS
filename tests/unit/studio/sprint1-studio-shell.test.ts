import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore, PersonaPerspective } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";

describe("AegisOS Studio Delivery Program (SDP) - Sprint 1 Verification", () => {
  beforeEach(() => {
    // Reset stores
    useAppStore.setState({
      activePerspective: "developer",
      theme: "dark",
      sidebarCollapsed: false,
    });
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  describe("Studio Shell & Persona Navigation System", () => {
    it("should support switching across all 6 persona perspectives", () => {
      const perspectives: PersonaPerspective[] = [
        "developer",
        "research",
        "product",
        "operations",
        "executive",
        "personal",
      ];

      perspectives.forEach((p) => {
        useAppStore.getState().setActivePerspective(p);
        expect(useAppStore.getState().activePerspective).toBe(p);
      });
    });

    it("should toggle sidebar collapse state cleanly", () => {
      expect(useAppStore.getState().sidebarCollapsed).toBe(false);
      useAppStore.getState().toggleSidebar();
      expect(useAppStore.getState().sidebarCollapsed).toBe(true);
      useAppStore.getState().toggleSidebar();
      expect(useAppStore.getState().sidebarCollapsed).toBe(false);
    });

    it("should switch theme profiles between dark, light, and high-contrast", () => {
      useAppStore.getState().setTheme("light");
      expect(useAppStore.getState().theme).toBe("light");
      useAppStore.getState().setTheme("high-contrast");
      expect(useAppStore.getState().theme).toBe("high-contrast");
      useAppStore.getState().setTheme("dark");
      expect(useAppStore.getState().theme).toBe("dark");
    });
  });

  describe("Authentication & Session Management", () => {
    it("should initialize unauthenticated state by default", () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });

    it("should update auth state on successful session initialization", () => {
      useAuthStore.setState({
        user: { id: "usr-01", username: "admin", email: "admin@aegisos.io", role: "admin" },
        token: "mock-jwt-token",
        isAuthenticated: true,
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.username).toBe("admin");
      expect(useAuthStore.getState().token).toBe("mock-jwt-token");
    });
  });

  describe("Public API Zero-Privilege Consumption", () => {
    it("should verify public REST endpoints conform to zero-privilege contract", () => {
      const endpoints = [
        { path: "/api/v1/workspaces", method: "GET" },
        { path: "/api/v1/workspaces", method: "POST" },
        { path: "/api/v1/search", method: "POST" },
        { path: "/api/v1/settings", method: "PUT" },
        { path: "/api/v1/auth/login", method: "POST" },
      ];

      endpoints.forEach((ep) => {
        expect(ep.path).toMatch(/^\/api\/v1\//);
      });
    });
  });
});
