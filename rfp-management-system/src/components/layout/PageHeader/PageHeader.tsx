
// src/components/layout/PageHeader/PageHeader.tsx
import React, { ReactNode } from 'react';
import { FiChevronRight } from '../../common/Icons';
import { Link } from 'react-router';

interface Breadcrumb {
  name: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  breadcrumbs,
  className = '',
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center text-sm text-neutral-500 dark:text-neutral-400 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <FiChevronRight className="mx-2 h-4 w-4" />}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {crumb.name}
                </Link>
              ) : (
                <span>{crumb.name}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {description}
            </p>
          )}
        </div>
        
        {actions && <div className="mt-4 md:mt-0">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
