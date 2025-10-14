import React, { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { MainLayout } from './components/MainLayout';
import { User, Role } from './types';

// Map usernames to user profiles for easy login
const userProfiles: { [key: string]: { name: string; role: Role } } = {
    admin: { name: 'Administrator', role: 'Administrator' },
    exec: { name: 'Executive User', role: 'Executive' },
    dev: { name: 'Developer User', role: 'Developer' },
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = (username: string, password: string) => { // Password is now ignored
    const normalizedUsername = username.toLowerCase().trim();
    const userProfile = userProfiles[normalizedUsername];
    
    if (userProfile) {
      setCurrentUser({
        id: Math.random(),
        name: userProfile.name,
        role: userProfile.role,
      });
      setLoginError(null);
    } else {
      setLoginError('Invalid username. Please use "admin", "exec", or "dev".');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} error={loginError} />;
  }

  return <MainLayout user={currentUser} onLogout={handleLogout} />;
};

export default App;