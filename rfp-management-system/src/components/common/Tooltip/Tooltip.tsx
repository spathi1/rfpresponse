
// src/components/common/Tooltip/Tooltip.tsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const childRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };
  
  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };
  
  // Calculate tooltip position
  useEffect(() => {
    if (isVisible && childRef.current) {
      const childRect = childRef.current.getBoundingClientRect();
      const tooltipWidth = tooltipRef.current?.offsetWidth || 0;
      const tooltipHeight = tooltipRef.current?.offsetHeight || 0;
      const gap = 8; // Gap between the child and tooltip
      
      let top = 0;
      let left = 0;
      
      switch (position) {
        case 'top':
          top = childRect.top + window.scrollY - tooltipHeight - gap;
          left = childRect.left + window.scrollX + (childRect.width / 2) - (tooltipWidth / 2);
          break;
        case 'right':
          top = childRect.top + window.scrollY + (childRect.height / 2) - (tooltipHeight / 2);
          left = childRect.right + window.scrollX + gap;
          break;
        case 'bottom':
          top = childRect.bottom + window.scrollY + gap;
          left = childRect.left + window.scrollX + (childRect.width / 2) - (tooltipWidth / 2);
          break;
        case 'left':
          top = childRect.top + window.scrollY + (childRect.height / 2) - (tooltipHeight / 2);
          left = childRect.left + window.scrollX - tooltipWidth - gap;
          break;
      }
      
      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);
  
  // Tooltip arrow classes
  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-t-neutral-800 dark:border-t-neutral-200 border-l-transparent border-r-transparent border-b-transparent';
      case 'right':
        return 'left-0 top-1/2 transform -translate-y-1/2 -translate-x-full border-r-neutral-800 dark:border-r-neutral-200 border-t-transparent border-b-transparent border-l-transparent';
      case 'bottom':
        return 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-b-neutral-800 dark:border-b-neutral-200 border-l-transparent border-r-transparent border-t-transparent';
      case 'left':
        return 'right-0 top-1/2 transform -translate-y-1/2 translate-x-full border-l-neutral-800 dark:border-l-neutral-200 border-t-transparent border-b-transparent border-r-transparent';
    }
  };
  
  return (
    <>
      <div
        ref={childRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`absolute z-50 px-2 py-1 text-sm text-white dark:text-neutral-900 bg-neutral-800 dark:bg-neutral-200 rounded shadow-sm max-w-xs ${className}`}
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
            }}
          >
            {content}
            <div
              className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`}
            ></div>
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;
