
// src/components/common/Dropdown/Dropdown.tsx
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  width?: number | string;
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  align = 'left',
  width = 'auto',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  const closeDropdown = () => {
    setIsOpen(false);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        triggerRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Calculate dropdown position
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      
      // Position dropdown below trigger
      setPosition({
        top: rect.bottom + window.scrollY,
        left: align === 'right' ? rect.right - (typeof width === 'number' ? width : 0) : rect.left,
      });
    }
  }, [isOpen, align, width]);
  
  return (
    <>
      <div ref={triggerRef} onClick={toggleDropdown} className="cursor-pointer">
        {trigger}
      </div>
      
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`absolute z-50 mt-2 rounded-md shadow-lg bg-white dark:bg-neutral-800 ring-1 ring-black ring-opacity-5 ${className}`}
            style={{
              top: position.top,
              left: position.left,
              width: width,
            }}
          >
            <div className="py-1">{children}</div>
          </div>,
          document.body
        )}
    </>
  );
};

export default Dropdown;
