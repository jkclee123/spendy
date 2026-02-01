"use client";

import { useState, useRef } from "react";
import { GripVertical } from "lucide-react";

interface DraggableListProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  onReorder: (newOrder: T[]) => void;
  disabled?: boolean;
}

/**
 * List component with drag-to-reorder functionality
 * - Supports touch and mouse drag
 * - Provides visual feedback during drag
 * - Calls onReorder on drop with new array order
 */
export function DraggableList<T>({
  items,
  keyExtractor,
  renderItem,
  onReorder,
  disabled = false,
}: DraggableListProps<T>) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.currentTarget.innerHTML);
    
    // Set drag image
    if (dragItemRef.current) {
      e.dataTransfer.setDragImage(dragItemRef.current, 0, 0);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (disabled || draggedIndex === null) return;
    e.preventDefault();
    
    if (index !== dragOverIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (disabled || draggedIndex === null) return;
    
    if (dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newItems = [...items];
      const [removed] = newItems.splice(draggedIndex, 1);
      newItems.splice(dragOverIndex, 0, removed);
      onReorder(newItems);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // Touch event support
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || draggedIndex === null || touchStartY === null) return;

    // Calculate which item we're over
    const element = document.elementFromPoint(
      e.touches[0].clientX,
      e.touches[0].clientY
    );
    
    const listItem = element?.closest('[data-draggable-item]');
    if (listItem) {
      const overIndex = parseInt(listItem.getAttribute('data-index') || '0', 10);
      setDragOverIndex(overIndex);
    }
  };

  const handleTouchEnd = () => {
    if (disabled || draggedIndex === null) return;
    
    if (dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newItems = [...items];
      const [removed] = newItems.splice(draggedIndex, 1);
      newItems.splice(dragOverIndex, 0, removed);
      onReorder(newItems);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    setTouchStartY(null);
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const isDragging = draggedIndex === index;
        const isDragOver = dragOverIndex === index;

        return (
          <div
            key={keyExtractor(item)}
            data-draggable-item
            data-index={index}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onDragLeave={handleDragLeave}
            onTouchStart={(e) => handleTouchStart(e, index)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            ref={isDragging ? dragItemRef : null}
            className={`
              flex items-center gap-3 transition-all duration-200
              ${isDragging ? "opacity-50" : "opacity-100"}
              ${isDragOver && !isDragging ? "translate-y-1" : ""}
            `}
          >
            {/* Drag handle */}
            {!disabled && (
              <div className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500">
                <GripVertical className="h-5 w-5" />
              </div>
            )}

            {/* Item content */}
            <div className="flex-1">{renderItem(item, index)}</div>
          </div>
        );
      })}
    </div>
  );
}
