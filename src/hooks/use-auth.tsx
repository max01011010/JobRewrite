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
  const [isLoading, setIsLoading] = useState(true); // Initial state is loading

  const isAuthenticated = !!user;

  const fetchUser = useCallback(async () => {
    console.log("Auth: fetchUser called. Setting isLoading to true.");
    setIsLoading(true); // Set loading true when fetching user
    try {
      // Now authClient.me() directly returns User, not { user: User }
      const data = await authClient.me();
      setUser(data); // Set the user directly
      console.log("Auth: fetchUser successful. User:", data, "isAuthenticated:", !!data);
    } catch (error) {
      console.error("Auth: Failed to fetch user:", error);
      setUser(null);
    } finally {
      setIsLoading(false); // Set loading false after fetch attempt
      console.log("Auth: fetchUser finished. isLoading:", false);
    }
  }, []);

  useEffect(() => {
    console.log("Auth: AuthProvider mounted. Initial fetchUser.");
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    let toastId: string | number | undefined;
    console.log("Auth: login function called.");
    try {
      toastId = showLoading("Logging in...");
      await authClient.login({ email, password });
      console.log("Auth: authClient.login successful. Now calling fetchUser to update state.");
      await fetchUser(); // Fetch user details after successful login
      showSuccess("Logged in successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      showError(`Login failed: ${errorMessage}`);
      setUser(null); // Ensure user is null on login failure
      throw error;
    } finally {
      if (toastId) dismissToast(toastId);
      console.log("Auth: login function finished.");
    }
  }, [fetchUser]);

  const signup = useCallback(async (email: string, first_name: string, last_name: string, password: string) => {
    let toastId: string | number | undefined;
    console.log("Auth: signup function called.");
    try {
      toastId = showLoading("Signing up...");
      await authClient.signup({ email, first_name, last_name, password });
      showSuccess("Sign up successful! Please log in.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      showError(`Sign up failed: ${errorMessage}`);
      throw error;
    } finally {
      if (toastId) dismissToast(toastId);
      console.log("Auth: signup function finished.");
    }
  }, []);

  const logout = useCallback(async () => {
    let toastId: string | number | undefined;
    console.log("Auth: logout function called.");
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
      setIsLoading(false); // Ensure isLoading is false after logout
      console.log("Auth: logout function finished. isLoading set to false.");
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