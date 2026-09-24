import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

export const AppShell: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="main-content-wrapper">
        <TopHeader onToggleMobileMenu={() => setMobileOpen(!mobileOpen)} />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
