import React from 'react';
import { useDrag } from 'react-dnd';

interface DraggableButtonProps {
  type: string;
  text: string;
  icon: React.ElementType;
}

export default function DraggableButton({ type, text, icon: Icon }: DraggableButtonProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'SIDEBAR_ITEM',
    item: { type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`sidebar-item ${isDragging ? 'dragging' : ''}`}
    >
      <Icon className="sidebar-icon" />
      <span>{text}</span>
    </div>
  );
}
