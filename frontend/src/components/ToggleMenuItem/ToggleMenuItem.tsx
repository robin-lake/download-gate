import { useState, type ReactNode } from 'react';
import { cn } from "@/lib/utils";

export interface ToggleMenuItemProps {
  stepNumber: number;
  title: string;
  completed?: boolean;
  defaultExpanded?: boolean;
  /** Controlled: when provided with onExpandedChange, parent controls open state (e.g. accordion). */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  children: ReactNode;
}

export default function ToggleMenuItem({
  stepNumber,
  title,
  completed = false,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onExpandedChange,
  children,
}: ToggleMenuItemProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = controlledExpanded !== undefined && onExpandedChange !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;

  const setExpanded = (value: boolean) => {
    if (isControlled) {
      onExpandedChange?.(value);
    } else {
      setInternalExpanded(value);
    }
  };

  return (
    <div
      className={cn(
        "mb-3 rounded-lg border border-neutral-200 bg-white",
        !isExpanded && "[&_.toggle-chevron]:-rotate-90"
      )}
    >
      <button
        type="button"
        className="toggle-menu-header flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-4 py-3.5 text-left font-inherit hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        onClick={() => setExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={`toggle-menu-item-content-${stepNumber}`}
        id={`toggle-menu-item-header-${stepNumber}`}
      >
        <span className="toggle-chevron flex items-center justify-center text-black transition-transform duration-200 ease-in-out" aria-hidden>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-black px-1.5 text-[13px] font-semibold text-white">
          {stepNumber}
        </span>
        <span className="flex-1 text-[15px] font-semibold text-black">{title}</span>
        {completed && (
          <span className="flex items-center justify-center text-neutral-400" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.333 4L6 11.333 2.667 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </button>
      <div
        id={`toggle-menu-item-content-${stepNumber}`}
        className="border-t border-neutral-100 px-4 pt-4 pb-4 [&[hidden]]:hidden"
        role="region"
        aria-labelledby={`toggle-menu-item-header-${stepNumber}`}
        hidden={!isExpanded}
      >
        {children}
      </div>
    </div>
  );
}
