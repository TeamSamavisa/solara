import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { useNavigate } from 'react-router';
import classroomImage from '@/assets/images/classroom.jpg';
import { SidebarNav } from './SidebarNav';

interface MainLayoutProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, isAdmin } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
  }

  if (requireAdmin && !isAdmin) {
    navigate('/');
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${classroomImage})`,
          filter: `grayscale(100%)`,
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--solara-800)]/90 to-[var(--solara-950)]/90" />

      {/* Rest of elements in container with higher z-index */}
      <div className="relative z-10 flex w-full">
        <Button
          variant="ghost"
          className={`fixed ${
            isSidebarOpen ? 'right-4' : 'left-4'
          } top-4 z-[100] md:hidden transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm hover:bg-white/90 dark:hover:bg-gray-800/90 h-12 w-12`}
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? (
            <X className="size-8 text-gray-800 dark:text-gray-100" />
          ) : (
            <Menu className="size-8 text-gray-800 dark:text-gray-100" />
          )}
        </Button>

        <div
          className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed md:relative md:translate-x-0 z-40 transition-transform duration-300 ease-in-out`}
        >
          <SidebarNav />
        </div>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main
          className={`h-screen flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'md:ml-64' : 'md:ml-0'
          }`}
        >
          <div className="container mx-auto p-6">
            <div className="h-16 md:h-0" />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
