// src/components/layout/ContentCard/ContentCard.tsx
import React, { ReactNode } from 'react';

interface ContentCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
  className?: string;
  noPadding?: boolean;
}

const ContentCard: React.FC<ContentCardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  className = '',
  noPadding = false,
}) => {
  return (
    <div className={`bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
      
      {footer && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 px-6 py-4 bg-neutral-50 dark:bg-neutral-900">
          {footer}
        </div>
      )}
    </div>
  );
};

export default ContentCard;