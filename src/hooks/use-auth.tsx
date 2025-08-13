import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthClient, User } from '@/utils/auth-client';
import { showLoading, showSuccess, showError, dismissToast } from '@/utils/toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, first_name: string, last_name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authClient = new AuthClient();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const fetchUser = useCallback(async () => {
    try {
      const data = await authClient.me();
      setUser(data.user);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    let toastId: string | number | undefined;
    try {
      setIsLoading(true);
      toastId = showLoading("Logging in...");
      await authClient.login({ email, password });
      await fetchUser(); // Fetch user details after successful login
      showSuccess("Logged in successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      showError(`Login failed: ${errorMessage}`);
      setUser(null);
      throw error; // Re-throw to allow form to catch
    } finally {
      setIsLoading(false);
      if (toastId) dismissToast(toastId);
    }
  }, [fetchUser]);

  const signup = useCallback(async (email: string, first_name: string, last_name: string, password: string) => {
    let toastId: string | number | undefined;
    try {
      setIsLoading(true);
      toastId = showLoading("Signing up...");
      await authClient.signup({ email, first_name, last_name, password });
      showSuccess("Sign up successful! Please log in.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      showError(`Sign up failed: ${errorMessage}`);
      throw error; // Re-throw to allow form to catch
    } finally {
      setIsLoading(false);
      if (toastId) dismissToast(toastId);
    }
  }, []);

  const logout = useCallback(async () => {
    let toastId: string | number | undefined;
    try {
      toastId = showLoading("Logging out...");
      await authClient.logout();
      setUser(null);
      showSuccess("Logged out successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      showError(`Logout failed: ${errorMessage}`);
    } finally {
      if (toastId) dismissToast(toastId);
    }
  }, []);

  const value = React.useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
  }), [user, isAuthenticated, isLoading, login, signup, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};