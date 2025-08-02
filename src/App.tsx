import React, { useState, useEffect } from 'react';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import QueueSystem from './components/QueueSystem';
import { adminService } from './lib/supabase';

function App() {
  const [currentView, setCurrentView] = useState('queue'); // 'queue', 'admin-login', 'admin-panel'
  const [adminSession, setAdminSession] = useState(null);

  useEffect(() => {
    // Verificar se há sessão de admin ativa
    const session = adminService.getCurrentSession();
    if (session) {
      setAdminSession(session);
      setCurrentView('admin-panel');
    }
  }, []);

  const handleAdminLogin = (session) => {
    setAdminSession(session);
    setCurrentView('admin-panel');
  };

  const handleAdminLogout = () => {
    adminService.logout();
    setAdminSession(null);
    setCurrentView('queue');
  };

  const handleGoToAdmin = () => {
    setCurrentView('admin-login');
  };

  const handleBackToQueue = () => {
    setCurrentView('queue');
  };

  if (currentView === 'admin-login') {
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  if (currentView === 'admin-panel' && adminSession) {
    return <AdminPanel session={adminSession} onLogout={handleAdminLogout} />;
  }

  return (
    <QueueSystem onGoToAdmin={handleGoToAdmin} />
  );
}

export default App;
