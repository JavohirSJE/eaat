// ============================================
// AUTHENTICATION CONTEXT - CORE AUTH LOGIC
// ============================================

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { Permission, UserRole } from '@/shared/constants/permissions';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  avatar?: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// AUTH PROVIDER COMPONENT
// ============================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const refreshTimeoutRef = React.useRef<NodeJS.Timeout>();

  /**
   * Check if token is expired
   */
  const isTokenExpired = useCallback((token: string): boolean => {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }, []);

  /**
   * Get token from storage
   */
  const getAccessToken = useCallback((): string | null => {
    return localStorage.getItem('accessToken');
  }, []);

  /**
   * Save auth data to storage
   */
  const saveAuthData = useCallback(
    (
      accessToken: string,
      refreshToken: string,
      userData: User
    ): void => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      // Set Axios header
      axiosInstance.defaults.headers.common['Authorization'] =
        `Bearer ${accessToken}`;

      setUser(userData);
      setIsAuthenticated(true);
    },
    []
  );

  /**
   * Clear auth data
   */
  const clearAuthData = useCallback((): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('lastRefreshTime');

    delete axiosInstance.defaults.headers.common['Authorization'];

    setUser(null);
    setIsAuthenticated(false);

    // Clear refresh timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
  }, []);

  /**
   * Refresh tokens
   */
  const refreshTokens = useCallback(async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        throw new Error('No refresh token found');
      }

      const response = await axiosInstance.post('/api/auth/refresh', {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken, user: userData } = response.data.data;

      saveAuthData(accessToken, newRefreshToken, userData);
      scheduleTokenRefresh(accessToken);
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthData();
      window.location.href = '/login';
    }
  }, [saveAuthData, clearAuthData]);

  /**
   * Schedule automatic token refresh
   * Refresh 5 minutes before expiry
   */
  const scheduleTokenRefresh = useCallback(
    (token: string): void => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      try {
        const decoded = jwtDecode<TokenPayload>(token);
        const expiryTime = decoded.exp * 1000;
        const currentTime = Date.now();
        const refreshBuffer = 5 * 60 * 1000; // 5 minutes
        const timeUntilRefresh = expiryTime - currentTime - refreshBuffer;

        if (timeUntilRefresh > 0) {
          refreshTimeoutRef.current = setTimeout(() => {
            refreshTokens();
          }, timeUntilRefresh);
        }
      } catch (error) {
        console.error('Failed to schedule token refresh:', error);
      }
    },
    [refreshTokens]
  );

  /**
   * Login
   */
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        const response = await axiosInstance.post('/api/auth/login', {
          email,
          password,
        });

        const { accessToken, refreshToken, user: userData } = response.data.data;

        saveAuthData(accessToken, refreshToken, userData);
        scheduleTokenRefresh(accessToken);
      } catch (error) {
        clearAuthData();
        throw error;
      }
    },
    [saveAuthData, scheduleTokenRefresh, clearAuthData]
  );

  /**
   * Logout
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      // Notify backend
      await axiosInstance.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      clearAuthData();
      window.location.href = '/login';
    }
  }, [clearAuthData]);

  /**
   * Initialize auth on app load
   */
  useEffect(() => {
    const initializeAuth = async (): Promise<void> => {
      try {
        const accessToken = getAccessToken();

        if (!accessToken) {
          setIsLoading(false);
          return;
        }

        // Check if token is expired
        if (isTokenExpired(accessToken)) {
          // Try to refresh
          await refreshTokens();
        } else {
          // Token is valid
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
            axiosInstance.defaults.headers.common['Authorization'] =
              `Bearer ${accessToken}`;
            scheduleTokenRefresh(accessToken);
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Check permission
   */
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false;
      return user.permissions.includes(permission);
    },
    [user]
  );

  /**
   * Check role
   */
  const hasRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      if (Array.isArray(role)) {
        return role.includes(user.role);
      }
      return user.role === role;
    },
    [user]
  );

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshTokens,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Auth hook
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
