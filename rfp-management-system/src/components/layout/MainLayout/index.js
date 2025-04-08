// src/components/layout/MainLayout/index.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiFileText,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiBell,
  FiSun,
  FiMoon
} from '../../common/Icons';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-900`}>
      {/* Top navigation bar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed z-30 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <button 
                  className="lg:hidden rounded-md p-2 inline-flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  onClick={toggleSidebar}
                >
                  <FiMenu className="h-6 w-6" />
                </button>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400 ml-2 md:ml-4">
                  RFP Manager
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {darkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
              </button>
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 relative">
                <FiBell className="h-5 w-5" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              </button>
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <div className="relative">
                    <button className="flex items-center max-w-xs bg-gray-100 dark:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      <span className="sr-only">Open user menu</span>
                      <div className="h-8 w-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                        US
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar / navigation */}
        <aside className={`fixed inset-y-0 pt-16 lg:pt-16 flex flex-col w-64 transition-transform duration-300 ease-in-out bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-20 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="h-0 flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              <Link 
                to="/dashboard" 
                className={`group flex items-center px-3 py-2 text-base font-medium rounded-md ${
                  isActive('/dashboard') || isActive('/') 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-200' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FiHome className={`mr-3 h-5 w-5 ${
                  isActive('/dashboard') || isActive('/') 
                    ? 'text-blue-500 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                }`} />
                Dashboard
              </Link>
              <Link 
                to="/documents" 
                className={`group flex items-center px-3 py-2 text-base font-medium rounded-md ${
                  isActive('/documents') 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-200' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FiFileText className={`mr-3 h-5 w-5 ${
                  isActive('/documents') 
                    ? 'text-blue-500 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                }`} />
                Documents
              </Link>
              <Link 
                to="/users" 
                className={`group flex items-center px-3 py-2 text-base font-medium rounded-md ${
                  isActive('/users') 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-200' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FiUsers className={`mr-3 h-5 w-5 ${
                  isActive('/users') 
                    ? 'text-blue-500 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                }`} />
                Users
              </Link>
              <Link 
                to="/settings" 
                className={`group flex items-center px-3 py-2 text-base font-medium rounded-md ${
                  isActive('/settings') 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-200' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FiSettings className={`mr-3 h-5 w-5 ${
                  isActive('/settings') 
                    ? 'text-blue-500 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                }`} />
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
            <button className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div>
                  <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                    US
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    User Name
                  </p>
                  <div className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                    <FiLogOut className="mr-1 h-4 w-4" />
                    Log out
                  </div>
                </div>
              </div>
            </button>
          </div>
        </aside>

        {/* Backdrop overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-10 bg-gray-600 bg-opacity-50 lg:hidden" 
            onClick={toggleSidebar}
          />
        )}

        {/* Main content */}
        <main className="flex-1 lg:pl-64 pt-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;