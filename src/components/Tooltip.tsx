import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  maxWidth?: string;
}

export function Tooltip({ 
  children, 
  content, 
  position = 'top', 
  delay = 300,
  maxWidth = '250px'
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate position when tooltip becomes visible
  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let x = 0;
      let y = 0;
      
      switch (position) {
        case 'top':
          x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          y = triggerRect.top - tooltipRect.height - 8;
          break;
        case 'bottom':
          x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          y = triggerRect.bottom + 8;
          break;
        case 'left':
          x = triggerRect.left - tooltipRect.width - 8;
          y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          break;
        case 'right':
          x = triggerRect.right + 8;
          y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          break;
      }
      
      // Ensure tooltip stays within viewport
      if (x < 10) x = 10;
      if (x + tooltipRect.width > window.innerWidth - 10) {
        x = window.innerWidth - tooltipRect.width - 10;
      }
      if (y < 10) y = 10;
      if (y + tooltipRect.height > window.innerHeight - 10) {
        y = window.innerHeight - tooltipRect.height - 10;
      }
      
      setCoords({ x, y });
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsVisible(false);
  };

  return (
    <div 
      className="inline-block relative"
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 bg-gray-800 text-white text-xs rounded-md shadow-lg p-2 border border-gray-700"
          style={{
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            maxWidth,
            pointerEvents: 'none',
            opacity: 0.95,
          }}
        >
          {content}
          <div 
            className={`absolute w-2 h-2 bg-gray-800 border-t border-l border-gray-700 transform rotate-45 ${
              position === 'bottom' ? 'top-0 -translate-y-1/2 left-1/2 -translate-x-1/2' :
              position === 'top' ? 'bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2' :
              position === 'left' ? 'right-0 translate-x-1/2 top-1/2 -translate-y-1/2' :
              'left-0 -translate-x-1/2 top-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </div>
  );
}