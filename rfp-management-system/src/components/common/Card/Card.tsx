// src/components/common/Card/Card.tsx


interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  noPadding?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  footer,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  noPadding = false,
  onClick,
}) => {
  const cardClasses = `bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden transition-shadow hover:shadow-md ${className}`;
  
  const headerClasses = `border-b border-neutral-200 dark:border-neutral-700 ${headerClassName}`;
  
  const bodyClasses = `${noPadding ? '' : 'p-4'} ${bodyClassName}`;
  
  const footerClasses = `border-t border-neutral-200 dark:border-neutral-700 p-4 ${footerClassName}`;
  
  return (
    <div className={cardClasses} onClick={onClick}>
      {(title || subtitle) && (
        <div className={headerClasses}>
          <div className="p-4">
            {title && <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
          </div>
        </div>
      )}
      
      <div className={bodyClasses}>{children}</div>
      
      {footer && <div className={footerClasses}>{footer}</div>}
    </div>
  );
};

export default Card;
