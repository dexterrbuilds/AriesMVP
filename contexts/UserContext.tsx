import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

type User = {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  isAdmin: number;
} | null;

type UserContextType = {
  user: User;
  token: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve stored user and token from SecureStore when the app loads
    const fetchStoredData = async () => {
      const storedUser = await SecureStore.getItemAsync('user');
      const storedToken = await SecureStore.getItemAsync('token');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    };

    fetchStoredData();
  }, []);

  return (
    <UserContext.Provider value={{ user, token, setUser, setToken }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
