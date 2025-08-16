'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import dynamic from 'next/dynamic';
import ComponentRenderer from './ComponentRenderer';
import Sidebar from './Sidebar';
import CanvasArea from './CanvasArea';
import EditorPanel from './EditorPanel';
import { COMPONENT_TYPES } from '@/lib/constants';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export interface CanvasComponent {
  id: string;
  type: string;
  content: string;
}

export interface DraggableItem {
  id: string;
  index: number;
  type: string;
}

export default function WebBuilder() {
  const [components, setComponents] = useState<CanvasComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<CanvasComponent | null>(null);
  const nextId = useRef(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((item: { type: string }, index?: number) => {
    const newComponent: CanvasComponent = {
      id: `${item.type}-${nextId.current++}`,
      type: item.type,
      content: getInitialContent(item.type),
    };

    if (index !== undefined) {
      const newComponents = [...components];
      newComponents.splice(index, 0, newComponent);
      setComponents(newComponents);
    } else {
      setComponents([...components, newComponent]);
    }
    
    setSelectedComponent(newComponent);
  }, [components]);

  const getInitialContent = (type: string): string => {
    switch (type) {
      case 'heading': return '<h2>New Heading</h2>';
      case 'paragraph': return '<p>This is a new paragraph. Start typing to edit...</p>';
      case 'image': return 'https://placehold.co/600x400';
      case 'header': return '<h1>Your Company Name</h1>';
      case 'footer': return '<p>&copy; 2024 Your Company. All rights reserved.</p>';
      default: return '';
    }
  };

  const handleComponentClick = (component: CanvasComponent) => {
    setSelectedComponent(component);
  };

  const handleDeleteComponent = (id: string) => {
    setComponents(components.filter(comp => comp.id !== id));
    if (selectedComponent?.id === id) {
      setSelectedComponent(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedComponent) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const updatedComponents = components.map(comp =>
        comp.id === selectedComponent.id 
          ? { ...comp, content: reader.result as string } 
          : comp
      );
      setComponents(updatedComponents);
      setSelectedComponent({ ...selectedComponent, content: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const moveComponent = useCallback((dragIndex: number, hoverIndex: number) => {
    setComponents(prev => {
      const newComponents = [...prev];
      const [dragged] = newComponents.splice(dragIndex, 1);
      newComponents.splice(hoverIndex, 0, dragged);
      return newComponents;
    });
  }, []);

  const updateComponentContent = (content: string) => {
    if (!selectedComponent) return;
    
    const updatedComponents = components.map(comp =>
      comp.id === selectedComponent.id 
        ? { ...comp, content } 
        : comp
    );
    setComponents(updatedComponents);
    setSelectedComponent({ ...selectedComponent, content });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="web-builder">
        <div className="builder-header">
          <h1>Web Builder</h1>
        </div>

        <div className="builder-container">
          <Sidebar />
          
          <CanvasArea 
            components={components}
            selectedComponent={selectedComponent}
            handleDrop={handleDrop}
            moveComponent={moveComponent}
            handleComponentClick={handleComponentClick}
            handleDeleteComponent={handleDeleteComponent}
          />
          
          <EditorPanel
            selectedComponent={selectedComponent}
            fileInputRef={fileInputRef}
            handleImageUpload={handleImageUpload}
            updateComponentContent={updateComponentContent}
            ReactQuill={ReactQuill}
          />
        </div>
      </div>
    </DndProvider>
  );
}
