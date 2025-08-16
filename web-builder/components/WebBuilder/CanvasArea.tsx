import React from 'react';
import { useDrop } from 'react-dnd';
import ComponentRenderer from './ComponentRenderer';

interface CanvasAreaProps {
  components: any[];
  selectedComponent: any;
  handleDrop: (item: any, index?: number) => void;
  moveComponent: (dragIndex: number, hoverIndex: number) => void;
  handleComponentClick: (component: any) => void;
  handleDeleteComponent: (id: string) => void;
}

export default function CanvasArea({
  components,
  selectedComponent,
  handleDrop,
  moveComponent,
  handleComponentClick,
  handleDeleteComponent
}: CanvasAreaProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'SIDEBAR_ITEM',
    drop: (item) => handleDrop(item),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div 
      className={`builder-canvas ${isOver ? 'drag-over' : ''}`} 
      ref={drop}
    >
      <h2>Canvas</h2>
      
      <div className="canvas-content">
        {components.length === 0 ? (
          <div className="empty-canvas">
            <p>Drag components here to start building</p>
          </div>
        ) : (
          components.map((component, index) => (
            <ComponentRenderer
              key={component.id}
              component={component}
              index={index}
              handleComponentClick={handleComponentClick}
              handleDeleteComponent={handleDeleteComponent}
              moveComponent={moveComponent}
            />
          ))
        )}
      </div>
    </div>
  );
}
