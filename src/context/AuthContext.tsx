import { createContext } from 'react';
import { User } from '../types';

export interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, password?: string, metadata?: any) => Promise<void>;
  loginWithProvider: (provider: 'google' | 'microsoft') => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
