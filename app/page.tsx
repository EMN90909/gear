'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Heading1, Text, Image, PanelTop, PanelBottom, 
  Trash2, Edit2, PlusCircle, Move, Moon, Sun
} from 'lucide-react';
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

type ComponentType = 'heading' | 'paragraph' | 'image' | 'header' | 'footer';

interface CanvasComponent {
  id: string;
  type: ComponentType;
  content: string;
}

interface DraggableItem {
  id: string;
  index: number;
  type: string;
}

const modules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'header': [1, 2, 3, false] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean']
  ],
};

export default function WebBuilder() {
  const [components, setComponents] = useState<CanvasComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<CanvasComponent | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const nextId = useRef(1);
  const quillRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initialize with sample components
  useEffect(() => {
    setComponents([
      { id: 'header-0', type: 'header', content: '<h1>Welcome to My Website</h1>' },
      { id: 'heading-0', type: 'heading', content: '<h2>About This Builder</h2>' },
      { id: 'paragraph-0', type: 'paragraph', content: '<p>Drag and drop components to create your layout. Select any component to edit its content.</p>' },
    ]);
  }, []);

  const handleDragStart = (type: ComponentType) => {
    return { type };
  };

  const handleDrop = (item: { type: ComponentType }, index?: number) => {
    const newComponent: CanvasComponent = {
      id: `${item.type}-${nextId.current++}`,
      type: item.type,
      content: getInitialContent(item.type),
    };

    if (index !== undefined) {
      // Insert at specific position
      const newComponents = [...components];
      newComponents.splice(index, 0, newComponent);
      setComponents(newComponents);
    } else {
      // Add to the end
      setComponents([...components, newComponent]);
    }
    
    setSelectedComponent(newComponent);
  };

  const getInitialContent = (type: ComponentType): string => {
    switch (type) {
      case 'heading': return '<h2>New Heading</h2>';
      case 'paragraph': return '<p>This is a new paragraph. Start typing to edit...</p>';
      case 'image': return 'https://placehold.co/600x400/94A3B8/FFFFFF?text=Upload+Image';
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

  const ComponentRenderer = ({ component, index }: { component: CanvasComponent; index: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    
    const [{ isDragging }, drag] = useDrag({
      type: 'COMPONENT',
      item: { id: component.id, index } as DraggableItem,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [, drop] = useDrop({
      accept: 'COMPONENT',
      hover(item: DraggableItem) {
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
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: component.content }} 
            />
          );
        case 'image':
          return (
            <img
              src={component.content}
              alt="Uploaded content"
              className="w-full h-auto max-h-96 object-contain rounded-lg shadow-md"
            />
          );
        default:
          return null;
      }
    };

    return (
      <div
        ref={ref}
        className={`group relative p-4 rounded-xl border-2 transition-all mb-4
          ${selectedComponent?.id === component.id 
            ? 'border-primary-500 bg-primary-50 dark:bg-gray-800 shadow-md' 
            : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
          }
          ${isDragging ? 'opacity-50' : 'opacity-100'}
        `}
        onClick={() => handleComponentClick(component)}
      >
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1 text-gray-500 bg-white dark:bg-gray-700 rounded-full shadow-md"
            title="Move component"
          >
            <Move className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteComponent(component.id);
            }}
            className="p-1 text-red-500 bg-white dark:bg-gray-700 rounded-full shadow-md"
            title="Delete component"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        {renderContent()}
      </div>
    );
  };

  const DraggableSidebarItem = ({ type, text, icon: Icon }: { 
    type: ComponentType; 
    text: string; 
    icon: React.ElementType;
  }) => {
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
        className={`bg-gray-100 dark:bg-gray-800 p-4 rounded-xl shadow-md flex flex-col items-center cursor-grab
          transition-all ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      >
        <Icon className="w-8 h-8 mb-2 text-primary-500" />
        <span className="font-semibold text-sm">{text}</span>
      </div>
    );
  };

  const DropArea = ({ onDrop, index }: { onDrop: (item: any) => void; index?: number }) => {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: ['SIDEBAR_ITEM', 'COMPONENT'],
      drop: (item) => onDrop(item, index),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }));

    return (
      <div
        ref={drop}
        className={`h-8 rounded-lg my-2 transition-all ${
          isOver ? 'bg-primary-300 dark:bg-primary-700' : 'bg-transparent'
        }`}
      />
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4">
        <div className="flex flex-col w-full max-w-7xl mx-auto">
          {/* Header */}
          <header className="flex justify-between items-center mb-6 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Edit2 className="text-primary-500" />
              Advanced Web Builder
            </h1>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </header>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="w-full lg:w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 flex-shrink-0">
              <h2 className="text-xl font-bold mb-4 text-center">Components</h2>
              <div className="space-y-4">
                <DraggableSidebarItem type="heading" text="Heading" icon={Heading1} />
                <DraggableSidebarItem type="paragraph" text="Paragraph" icon={Text} />
                <DraggableSidebarItem type="image" text="Image" icon={Image} />
                <DraggableSidebarItem type="header" text="Header" icon={PanelTop} />
                <DraggableSidebarItem type="footer" text="Footer" icon={PanelBottom} />
              </div>
            </div>

            {/* Main Canvas */}
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-center">Web Page Canvas</h2>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl min-h-[70vh] p-4">
                <DropArea onDrop={handleDrop} index={0} />
                
                {components.length === 0 ? (
                  <div 
                    className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8"
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <PlusCircle className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">Drag and drop components here to start building</p>
                    <p className="text-sm mt-2">or select components from the sidebar</p>
                  </div>
                ) : (
                  components.map((component, index) => (
                    <React.Fragment key={component.id}>
                      <ComponentRenderer component={component} index={index} />
                      <DropArea onDrop={handleDrop} index={index + 1} />
                    </React.Fragment>
                  ))
                )}
              </div>
            </div>

            {/* Editor Panel */}
            <div className="w-full lg:w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 flex-shrink-0">
              <h2 className="text-xl font-bold mb-4 text-center">Editor</h2>
              {selectedComponent ? (
                <div>
                  <div className="flex items-center text-gray-600 dark:text-gray-300 mb-4">
                    <Edit2 className="w-5 h-5 mr-2" />
                    <span className="font-semibold capitalize">{selectedComponent.type}</span>
                  </div>
                  
                  {selectedComponent.type === 'image' ? (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <img 
                          src={selectedComponent.content} 
                          alt="Preview" 
                          className="max-h-48 rounded-lg"
                        />
                      </div>
                      
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                      >
                        Upload New Image
                      </button>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">Image URL</label>
                        <input
                          type="text"
                          value={selectedComponent.content}
                          onChange={(e) => {
                            const newContent = e.target.value;
                            const updatedComponents = components.map(comp =>
                              comp.id === selectedComponent.id 
                                ? { ...comp, content: newContent } 
                                : comp
                            );
                            setComponents(updatedComponents);
                            setSelectedComponent({ ...selectedComponent, content: newContent });
                          }}
                          className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
                          placeholder="Enter image URL"
                        />
                      </div>
                    </div>
                  ) : (
                    <ReactQuill
                      ref={quillRef}
                      theme="snow"
                      value={selectedComponent.content}
                      onChange={(content) => {
                        const updatedComponents = components.map(comp =>
                          comp.id === selectedComponent.id 
                            ? { ...comp, content } 
                            : comp
                        );
                        setComponents(updatedComponents);
                        setSelectedComponent({ ...selectedComponent, content });
                      }}
                      modules={modules}
                      className="rounded-lg overflow-hidden"
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Edit2 className="w-12 h-12 mb-4" />
                  <p>Select a component to edit</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
