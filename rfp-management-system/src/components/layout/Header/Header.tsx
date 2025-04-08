// src/components/layout/Header/Header.tsx
import React, { useState } from 'react';
import { Link } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { 
  FiMenu, 
  FiSearch, 
  FiBell, 
  FiUser, 
  FiSun, 
  FiMoon,
  FiLogOut,
  FiSettings
} from 'react-icons/fi';
import { selectUI, setTheme } from '../../../store/slices/uiSlice';
import { selectAuth, logout } from '../../../store/slices/authSlice';
import Dropdown from '../../common/Dropdown/Dropdown';
import { User } from '../../../types/user.types';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const { theme, notifications } = useSelector(selectUI);
  const { user } = useSelector(selectAuth);
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    dispatch(setTheme(newTheme));
  };
  
  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
  };
  
  // User initial avatar
  const getUserInitials = (user: User) => {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  };
  
  return (
    <header className="z-10 bg-white dark:bg-neutral-800 shadow-sm border-b border-neutral-200 dark:border-neutral-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left section - Logo and menu toggle */}
          <div className="flex items-center">
            <button
              className="mr-2 p-2 rounded-md text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 focus:outline-none"
              onClick={toggleSidebar}
            >
              <FiMenu className="h-6 w-6" />
            </button>
            
            <Link to="/" className="flex items-center">
              <span className="text-xl font-semibold text-primary-600 dark:text-primary-400">
                RFP Manager
              </span>
            </Link>
          </div>
          
          {/* Right section - Search, notifications, user menu */}
          <div className="flex items-center space-x-4">
            {/* Quick search */}
            <button
              className="p-2 rounded-md text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 focus:outline-none"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <FiSearch className="h-5 w-5" />
            </button>
            
            {/* Theme toggle */}
            <button
              className="p-2 rounded-md text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 focus:outline-none"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <FiSun className="h-5 w-5" />
              ) : (
                <FiMoon className="h-5 w-5" />
              )}
            </button>
            
            {/* Notifications */}
            <Dropdown
              trigger={
                <button className="p-2 rounded-md text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 focus:outline-none relative">
                  <FiBell className="h-5 w-5" />
                  {notifications.unread > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-danger-600 text-white">
                      {notifications.unread > 9 ? '9+' : notifications.unread}
                    </span>
                  )}
                </button>
              }
              align="right"
              width={320}
              className="py-0"
            >
              <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Notifications
                </h3>
              </div>
              
              {notifications.unread === 0 ? (
                <div className="px-4 py-6 text-center text-neutral-500 dark:text-neutral-400">
                  <p>No new notifications.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 dark:divide-neutral-700 max-h-60 overflow-y-auto">
                  {/* Notification items would go here */}
                  <div className="px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      New document uploaded
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      A new document has been uploaded and is ready for review.
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                      5 minutes ago
                    </p>
                  </div>
                </div>
              )}
              
              <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700 text-center">
                <Link
                  to="/notifications"
                  className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  View all
                </Link>
              </div>
            </Dropdown>
            
            {/* User menu */}
            {user && (
              <Dropdown
                trigger={
                  <button className="flex items-center focus:outline-none">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium">
                        {getUserInitials(user)}
                      </div>
                    )}
                  </button>
                }
                align="right"
                width={220}
              >
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {user.email}
                  </p>
                </div>
                
                <div className="py-1">
                  <Link
                    to="/settings/profile"
                    className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center"
                  >
                    <FiUser className="mr-3 h-4 w-4" />
                    Profile
                  </Link>
                  
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center"
                  >
                    <FiSettings className="mr-3 h-4 w-4" />
                    Settings
                  </Link>
                  
                  <button
                    className="w-full text-left block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center"
                    onClick={handleLogout}
                  >
                    <FiLogOut className="mr-3 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </Dropdown>
            )}
          </div>
        </div>
      </div>
      
      {/* Search modal/overlay would go here */}
    </header>
  );
};

export default Header;

