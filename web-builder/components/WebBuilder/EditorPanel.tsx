import React from 'react';

interface EditorPanelProps {
  selectedComponent: any;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  updateComponentContent: (content: string) => void;
  ReactQuill: any;
}

export default function EditorPanel({
  selectedComponent,
  fileInputRef,
  handleImageUpload,
  updateComponentContent,
  ReactQuill
}: EditorPanelProps) {
  return (
    <div className="editor-panel">
      <h2>Editor</h2>
      
      {selectedComponent ? (
        <div className="editor-content">
          <div className="editor-header">
            <h3>{selectedComponent.type.charAt(0).toUpperCase() + selectedComponent.type.slice(1)}</h3>
          </div>
          
          {selectedComponent.type === 'image' ? (
            <div className="image-editor">
              <div className="image-preview">
                <img src={selectedComponent.content} alt="Preview" />
              </div>
              
              <button
                className="upload-button"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload New Image
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden-input"
              />
              
              <div className="url-editor">
                <label>Image URL</label>
                <input
                  type="text"
                  value={selectedComponent.content}
                  onChange={(e) => updateComponentContent(e.target.value)}
                  placeholder="Enter image URL"
                />
              </div>
            </div>
          ) : (
            <div className="text-editor">
              {ReactQuill && (
                <ReactQuill
                  value={selectedComponent.content}
                  onChange={updateComponentContent}
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'header': [1, 2, 3, false] }],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link'],
                      ['clean']
                    ],
                  }}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="no-selection">
          <p>Select a component to edit</p>
        </div>
      )}
    </div>
  );
}
