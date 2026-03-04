import { useState, type ReactNode } from 'react';
import './ToggleMenuItem.scss';

export interface ToggleMenuItemProps {
  stepNumber: number;
  title: string;
  completed?: boolean;
  defaultExpanded?: boolean;
  children: ReactNode;
}

export default function ToggleMenuItem({
  stepNumber,
  title,
  completed = false,
  defaultExpanded = true,
  children,
}: ToggleMenuItemProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`toggle-menu-item ${isExpanded ? 'toggle-menu-item--expanded' : ''}`}>
      <button
        type="button"
        className="toggle-menu-item__header"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-controls={`toggle-menu-item-content-${stepNumber}`}
        id={`toggle-menu-item-header-${stepNumber}`}
      >
        <span className="toggle-menu-item__chevron" aria-hidden>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="toggle-menu-item__badge">{stepNumber}</span>
        <span className="toggle-menu-item__title">{title}</span>
        {completed && (
          <span className="toggle-menu-item__check" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.333 4L6 11.333 2.667 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </button>
      <div
        id={`toggle-menu-item-content-${stepNumber}`}
        className="toggle-menu-item__content"
        role="region"
        aria-labelledby={`toggle-menu-item-header-${stepNumber}`}
        hidden={!isExpanded}
      >
        {children}
      </div>
    </div>
  );
}
