import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { COMPONENT_TYPES } from '@/lib/constants';

interface ComponentRendererProps {
  component: any;
  index: number;
  handleComponentClick: (component: any) => void;
  handleDeleteComponent: (id: string) => void;
  moveComponent: (dragIndex: number, hoverIndex: number) => void;
}

export default function ComponentRenderer({
  component,
  index,
  handleComponentClick,
  handleDeleteComponent,
  moveComponent
}: ComponentRendererProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'COMPONENT',
    item: { id: component.id, index } as any,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'COMPONENT',
    hover(item: any) {
      if (!ref.current) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      if (dragIndex === hoverIndex) return;
      
      moveComponent(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  const renderContent = () => {
    switch (component.type) {
      case 'heading':
      case 'paragraph':
      case 'header':
      case 'footer':
        return (
          <div 
            className="component-content"
            dangerouslySetInnerHTML={{ __html: component.content }} 
          />
        );
      case 'image':
        return (
          <img
            src={component.content}
            alt="Uploaded content"
            className="component-image"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={ref}
      className={`component-item ${isDragging ? 'dragging' : ''} ${
        component.id === component.id ? 'selected' : ''
      }`}
      onClick={() => handleComponentClick(component)}
    >
      {renderContent()}
      <div className="component-actions">
        <button
          className="delete-button"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteComponent(component.id);
          }}
          title="Delete component"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M3 6v18h18v-18h-18zm5 14c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm4-18v2h-20v-2h5.711c.9 0 1.631-1.099 1.631-2h5.315c0 .901.73 2 1.631 2h5.712z"/>
          </svg>
        </button>
        <div className="drag-handle" title="Drag to reorder">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M20 9H4v2h16V9zM4 15h16v-2H4v2z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
