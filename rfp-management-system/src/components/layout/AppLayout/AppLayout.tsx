// src/components/layout/AppLayout/AppLayout.tsx
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import { selectUI, setSidebarOpen, setIsMobile } from '../../../store/slices/uiSlice';

const AppLayout: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { sidebarOpen, isMobile } = useSelector(selectUI);
  
  // Check for mobile devices on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      if (mobile !== isMobile) {
        dispatch(setIsMobile(mobile));
      }
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [dispatch, isMobile]);
  
  // Close sidebar on route change in mobile view
  useEffect(() => {
    if (isMobile) {
      dispatch(setSidebarOpen(false));
    }
  }, [location.pathname, isMobile, dispatch]);
  
  // Handle sidebar toggle
  const toggleSidebar = () => {
    dispatch(setSidebarOpen(!sidebarOpen));
  };
  
  return (
    <div className="min-h-screen h-full flex flex-col bg-neutral-50 dark:bg-neutral-900">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className={`flex-1 overflow-auto transition-all duration-200 ${sidebarOpen && !isMobile ? 'ml-64' : ''}`}>
          <div className="container mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

