import React, { useState, useRef, useEffect } from 'react';

interface ResizableLayoutProps {
  children: React.ReactNode[];
  direction?: 'horizontal' | 'vertical';
  initialSizes?: number[];
  minSizes?: number[];
  className?: string;
}

export function ResizableLayout({ 
  children, 
  direction = 'horizontal', 
  initialSizes, 
  minSizes,
  className = '' 
}: ResizableLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState<number[]>(() => {
    if (initialSizes) return initialSizes;
    const defaultSize = 100 / children.length;
    return new Array(children.length).fill(defaultSize);
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState(-1);
  const [startPos, setStartPos] = useState(0);
  const [startSizes, setStartSizes] = useState<number[]>([]);

  const minSize = minSizes || new Array(children.length).fill(10);

  const handleMouseDown = (index: number, event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
    setDragIndex(index);
    setStartPos(direction === 'horizontal' ? event.clientX : event.clientY);
    setStartSizes([...sizes]);
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging || dragIndex === -1 || !containerRef.current) return;

      event.preventDefault();
      
      const container = containerRef.current;
      const containerSize = direction === 'horizontal' 
        ? container.offsetWidth 
        : container.offsetHeight;
      
      const currentPos = direction === 'horizontal' ? event.clientX : event.clientY;
      const delta = currentPos - startPos;
      const deltaPercent = (delta / containerSize) * 100;

      const newSizes = [...startSizes];
      const leftIndex = dragIndex;
      const rightIndex = dragIndex + 1;

      // Calculate new sizes with constraints
      let newLeftSize = startSizes[leftIndex] + deltaPercent;
      let newRightSize = startSizes[rightIndex] - deltaPercent;

      // Apply minimum size constraints
      if (newLeftSize < minSize[leftIndex]) {
        const diff = minSize[leftIndex] - newLeftSize;
        newLeftSize = minSize[leftIndex];
        newRightSize -= diff;
      }
      
      if (newRightSize < minSize[rightIndex]) {
        const diff = minSize[rightIndex] - newRightSize;
        newRightSize = minSize[rightIndex];
        newLeftSize -= diff;
      }

      // Ensure we don't go below minimum sizes
      if (newLeftSize >= minSize[leftIndex] && newRightSize >= minSize[rightIndex]) {
        newSizes[leftIndex] = newLeftSize;
        newSizes[rightIndex] = newRightSize;
        setSizes(newSizes);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragIndex(-1);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isDragging) {
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragIndex, startPos, startSizes, direction, minSize]);

  const flexDirection = direction === 'horizontal' ? 'flex-row' : 'flex-col';
  const resizeHandleClass = direction === 'horizontal' 
    ? 'w-2 cursor-col-resize group' 
    : 'h-2 cursor-row-resize group';

  return (
    <div 
      ref={containerRef}
      className={`flex ${flexDirection} h-full ${className}`}
    >
      {children.map((child, index) => (
        <React.Fragment key={index}>
          <div 
            className="flex-shrink-0 overflow-hidden"
            style={{
              [direction === 'horizontal' ? 'width' : 'height']: `${sizes[index]}%`
            }}
          >
            {child}
          </div>
          {index < children.length - 1 && (
            <div
              className={`relative flex items-center justify-center bg-gray-700 transition-all duration-200 ${resizeHandleClass} ${
                isDragging && dragIndex === index 
                  ? 'bg-blue-500 shadow-lg' 
                  : 'hover:bg-gray-600'
              }`}
              onMouseDown={(e) => handleMouseDown(index, e)}
            >
              {/* Visual indicator */}
              <div className={`${
                direction === 'horizontal' 
                  ? 'w-0.5 h-8 bg-gray-500 group-hover:bg-gray-400' 
                  : 'h-0.5 w-8 bg-gray-500 group-hover:bg-gray-400'
              } transition-colors duration-200 ${
                isDragging && dragIndex === index ? 'bg-white' : ''
              }`} />
              
              {/* Invisible larger hit area for easier grabbing */}
              <div className={`absolute ${
                direction === 'horizontal' 
                  ? 'w-4 h-full -left-1' 
                  : 'h-4 w-full -top-1'
              }`} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}