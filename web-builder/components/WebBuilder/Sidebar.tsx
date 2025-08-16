import React from 'react';
import { useDrag } from 'react-dnd';
import DraggableButton from './DraggableButton';
import { COMPONENT_TYPES } from '@/lib/constants';

export default function Sidebar() {
  return (
    <div className="builder-sidebar">
      <h2>Components</h2>
      <div className="sidebar-components">
        {Object.entries(COMPONENT_TYPES).map(([type, { text, icon }]) => (
          <DraggableButton 
            key={type} 
            type={type} 
            text={text} 
            icon={icon} 
          />
        ))}
      </div>
    </div>
  );
}
