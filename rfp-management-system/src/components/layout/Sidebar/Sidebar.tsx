// src/components/layout/Sidebar/Sidebar.tsx

import { NavLink, useLocation } from 'react-router';
import { useSelector } from 'react-redux';
import { 
  FiHome, 
  FiFileText, 
  FiSearch, 
  FiPieChart, 
  FiSettings, 
  FiUsers,
  FiTag,
  FiFolder,
  FiShield,
  FiCpu
} from '../../common/Icons';
import { selectAuth } from '../../../store/slices/authSlice';
import { UserRole } from '../../../types/user.types';

interface SidebarProps {
  isOpen: boolean;
}

interface SidebarNavItem {
  name: string;
  to: string;
  icon: JSX.Element;
  requiredRole?: UserRole[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { user } = useSelector(selectAuth);
  
  // Navigation items
  const navItems: SidebarNavItem[] = [
    {
      name: 'Dashboard',
      to: '/',
      icon: <FiHome size={20} />,
    },
    {
      name: 'Documents',
      to: '/documents',
      icon: <FiFileText size={20} />,
    },
    {
      name: 'Search',
      to: '/search',
      icon: <FiSearch size={20} />,
    },
    {
      name: 'Analytics',
      to: '/analytics',
      icon: <FiPieChart size={20} />,
    },
    {
      name: 'Collections',
      to: '/collections',
      icon: <FiFolder size={20} />,
    },
    {
      name: 'Taxonomy',
      to: '/taxonomy',
      icon: <FiTag size={20} />,
      requiredRole: ['admin', 'manager'],
    },
    {
      name: 'Security & Compliance',
      to: '/security',
      icon: <FiShield size={20} />,
      requiredRole: ['admin'],
    },
    {
      name: 'AI Integration',
      to: '/ai-integration',
      icon: <FiCpu size={20} />,
      requiredRole: ['admin', 'manager'],
    },
    {
      name: 'User Management',
      to: '/users',
      icon: <FiUsers size={20} />,
      requiredRole: ['admin'],
    },
    {
      name: 'Settings',
      to: '/settings',
      icon: <FiSettings size={20} />,
    },
  ];
  
  // Filter items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!item.requiredRole) return true;
    return user && item.requiredRole.includes(user.role as UserRole);
  });
  
  // Check if a route is active
  const isRouteActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={(e) => e.stopPropagation()}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-30 w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 shadow-sm transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar header */}
          <div className="h-16 flex items-center justify-center border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-xl font-bold text-primary-600 dark:text-primary-400">
              RFP Manager
            </h2>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {filteredNavItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:bg-opacity-30 dark:text-primary-300'
                          : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                      }`
                    }
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Sidebar footer */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="h-8 w-8 rounded-full mr-3"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium mr-3">
                  {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
                </div>
              )}
              <div className="text-sm">
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
