import { useState, useEffect, useRef } from 'react';

// Main App component that acts as the multi-file HTML editor
export default function App() {
  // Define default content for each file. This is the starting project.
  const defaultFiles = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Awesome Page</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Welcome to the Live HTML Editor!</h1>
    <p>
        Edit the code in the different tabs above and see the changes live here.
        This editor supports HTML, CSS, and JavaScript.
    </p>
    <button id="my-button">Click Me!</button>
    <script src="script.js"></script>
    <div id="message-box"></div>
</body>
</html>`,
    'styles.css': `body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background-color: #f0fdf4;
    color: #166534;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
    padding: 2rem;
}
h1 {
    color: #065f46;
    font-weight: 700;
    margin-bottom: 1rem;
}
p {
    max-width: 600px;
    line-height: 1.5;
}
#my-button {
    background-color: #22c55e;
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    margin-top: 1rem;
    transition: background-color 0.3s ease;
}
#my-button:hover {
    background-color: #16a34a;
}`,
    'script.js': `document.getElementById('my-button').addEventListener('click', () => {
    // We'll use a custom message box as alert() is not supported in this environment.
    const messageBox = document.getElementById('message-box');
    if (messageBox) {
        messageBox.textContent = 'Button clicked!';
        messageBox.className = 'absolute top-4 left-1/2 -translate-x-1/2 p-3 rounded-lg text-center font-bold bg-green-900 text-green-300 transition-opacity duration-300';
        messageBox.style.opacity = 1;
        setTimeout(() => {
            messageBox.style.opacity = 0;
        }, 3000);
    }
});`
  };

  // State variables for managing the editor and files
  const [files, setFiles] = useState(defaultFiles);
  const [activeFile, setActiveFile] = useState('index.html');
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // States for the custom modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFileNameInput, setNewFileNameInput] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [fileToRename, setFileToRename] = useState(null);
  const [newFileNameForRename, setNewFileNameForRename] = useState('');
  
  // State for the right-click context menu
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, fileName: null });

  // States for hidden files
  const [hiddenFiles, setHiddenFiles] = useState([]);

  // Constants
  const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB in bytes

  // State for the file menu visibility
  const [showFileMenu, setShowFileMenu] = useState(false);
  const fileMenuRef = useRef(null);
  
  // State and refs for horizontal resizing
  const [editorWidth, setEditorWidth] = useState(50); // Initial percentage
  const resizerRef = useRef(null);

  // New state for controlling the preview mode (web or mobile)
  const [previewMode, setPreviewMode] = useState('web');

  // State for managing the download status
  const [isDownloading, setIsDownloading] = useState(false);

  // useEffect hook to handle local storage persistence for files
  useEffect(() => {
    try {
      const savedFiles = localStorage.getItem('htmlEditorFiles');
      if (savedFiles) {
        setFiles(JSON.parse(savedFiles));
      }
    } catch (e) {
      console.error('Failed to load files from local storage:', e);
    }
  }, []);

  // useEffect hook to save files state to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('htmlEditorFiles', JSON.stringify(files));
    } catch (e) {
      console.error('Failed to save files to local storage:', e);
    }
  }, [files]);

  // useEffect hook to save hidden files state to local storage
  useEffect(() => {
    try {
      const savedHiddenFiles = localStorage.getItem('htmlEditorHiddenFiles');
      if (savedHiddenFiles) {
        setHiddenFiles(JSON.parse(savedHiddenFiles));
      }
      localStorage.setItem('htmlEditorHiddenFiles', JSON.stringify(hiddenFiles));
    } catch (e) {
      console.error('Failed to save hidden files to local storage:', e);
    }
  }, [hiddenFiles]);

  // A crucial useEffect hook to update the preview whenever the files change
  // This makes the editor "live" as changes are reflected automatically.
  useEffect(() => {
    updatePreview();
  }, [files]);

  // Effect to handle clicks outside the context menu to close it
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);

  // Effect to handle clicks outside the file menu to close it
  useEffect(() => {
    const handleClickOutsideFileMenu = (event) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target) && showFileMenu) {
        setShowFileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideFileMenu);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideFileMenu);
    };
  }, [showFileMenu]);

  // Resizer logic
  const handleMouseDown = (e) => {
    const startX = e.clientX;
    const startWidth = resizerRef.current.previousElementSibling.offsetWidth;

    const handleMouseMove = (event) => {
      const newWidth = startWidth + (event.clientX - startX);
      const newWidthPercent = (newWidth / window.innerWidth) * 100;
      setEditorWidth(Math.min(Math.max(20, newWidthPercent), 80)); // Clamp between 20% and 80%
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  /**
   * Generates the full HTML content by combining HTML, CSS, and JS.
   * @returns {string} The full HTML string for the preview iframe.
   */
  const getFullHtml = () => {
    // Find all CSS and JS files to embed
    const cssContent = Object.entries(files)
      .filter(([fileName]) => fileName.endsWith('.css'))
      .map(([, content]) => content)
      .join('\n');
    
    const jsContent = Object.entries(files)
      .filter(([fileName]) => fileName.endsWith('.js'))
      .map(([, content]) => content)
      .join('\n');

    // Return the full HTML, embedding CSS in a <style> tag and JS in a <script> tag
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Live Preview</title>
          <style>${cssContent}</style>
      </head>
      <body>
          ${files['index.html']}
          <script>${jsContent}</script>
      </body>
      </html>
    `;
  };

  /**
   * Updates the content of the preview iframe.
   */
  const updatePreview = () => {
    const iframe = document.getElementById('preview');
    if (iframe) {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(getFullHtml());
      iframeDoc.close();
    }
  };

  /**
   * Handles changes in the editor textarea and updates the state.
   * @param {object} e - The change event.
   */
  const handleEditorChange = (e) => {
    setFiles({
      ...files,
      [activeFile]: e.target.value
    });
  };

  /**
   * Handles the file upload process.
   * @param {object} e - The file upload event.
   */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      showMessage(`File size exceeds 3MB limit.`, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileName = file.name;
      
      // Add the new file to the files state
      setFiles(prevFiles => ({
        ...prevFiles,
        [fileName]: event.target.result
      }));
      setActiveFile(fileName);
      showMessage(`Successfully uploaded ${fileName}!`, 'success');
    };
    reader.readAsText(file);
  };
  
  /**
   * Handles creating a new file from the modal.
   */
  const handleAddFile = () => {
      const newFileName = newFileNameInput.trim();
      if (!newFileName) {
          showMessage("File name cannot be empty.", 'error');
          return;
      }

      if (files[newFileName]) {
          showMessage(`File "${newFileName}" already exists.`, 'error');
      } else {
          setFiles(prevFiles => ({
              ...prevFiles,
              [newFileName]: '' // Create an empty file
          }));
          setActiveFile(newFileName);
          showMessage(`Created new file: ${newFileName}`, 'success');
      }
      setShowAddModal(false);
      setNewFileNameInput('');
  };

  /**
   * Handles deleting a file with a confirmation modal.
   */
  const handleDeleteFile = () => {
      if (Object.keys(files).length === 1) {
          showMessage("Cannot delete the last file.", 'error');
          setShowDeleteModal(false);
          return;
      }
      
      const newFiles = { ...files };
      delete newFiles[fileToDelete];
      setFiles(newFiles);
      
      // Switch to a different file if the active one was deleted
      if (activeFile === fileToDelete) {
          const remainingFiles = Object.keys(newFiles);
          setActiveFile(remainingFiles[0]);
      }
      showMessage(`Deleted file: ${fileToDelete}`, 'success');
      setShowDeleteModal(false);
      setFileToDelete(null);
  };

  /**
   * Handles renaming a file.
   */
  const handleRenameFile = () => {
    const newFileName = newFileNameForRename.trim();
    if (!newFileName) {
      showMessage("File name cannot be empty.", 'error');
      return;
    }

    if (files[newFileName]) {
      showMessage(`File "${newFileName}" already exists.`, 'error');
      return;
    }

    const oldContent = files[fileToRename];
    const newFiles = { ...files };
    delete newFiles[fileToRename];
    newFiles[newFileName] = oldContent;

    setFiles(newFiles);
    setActiveFile(newFileName);
    showMessage(`Renamed file to: ${newFileName}`, 'success');
    setShowRenameModal(false);
    setFileToRename(null);
    setNewFileNameForRename('');
  };
  
  /**
   * Hides a file from the file list.
   * @param {string} fileName - The name of the file to hide.
   */
  const handleHideFile = (fileName) => {
    setHiddenFiles(prevHidden => [...prevHidden, fileName]);
    if (activeFile === fileName) {
        const remainingFiles = Object.keys(files).filter(f => f !== fileName && !hiddenFiles.includes(f));
        setActiveFile(remainingFiles.length > 0 ? remainingFiles[0] : Object.keys(files).find(f => f !== fileName));
    }
    setContextMenu({ ...contextMenu, visible: false });
    showMessage(`Hidden file: ${fileName}`, 'success');
  };

  /**
   * Handles the download of the entire project as a single ZIP file.
   */
  const handleDownloadProject = async () => {
    try {
      if (typeof window.JSZip === 'undefined' || typeof window.saveAs === 'undefined') {
        showMessage('Required libraries are still loading. Please wait a moment.', 'error');
        return;
      }
      setIsDownloading(true);
      const zip = new window.JSZip();
      
      // Add each file to the zip archive
      Object.keys(files).forEach(fileName => {
        zip.file(fileName, files[fileName]);
      });
      
      // Generate the zip file as a blob and save it
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      window.saveAs(zipBlob, 'web-project.zip');

      showMessage('Project downloaded successfully!', 'success');
    } catch (error) {
      console.error('Download failed:', error);
      showMessage('Failed to download project.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Displays a temporary message.
   * @param {string} text - The message to display.
   * @param {string} type - The type of message ('success' or 'error').
   */
  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 3000);
  };

  /**
   * Handles the right-click event to show the context menu.
   * @param {object} e - The mouse event.
   * @param {string} fileName - The name of the file being clicked.
   */
  const handleContextMenu = (e, fileName) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      fileName,
    });
  };

  // Dynamically load JSZip and FileSaver.js from CDNs
  useEffect(() => {
    const loadScript = (src, callback) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = callback;
      script.onerror = () => console.error(`Failed to load script: ${src}`);
      document.body.appendChild(script);
    };

    loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', () => {
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js', () => {
        console.log('JSZip and FileSaver loaded!');
      });
    });
  }, []);

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Message Box */}
      {message.text && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 p-3 rounded-lg text-center font-bold transition-opacity duration-300 z-50 ${
            message.type === 'success' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
          }`}
          style={{ opacity: 1 }}
        >
          {message.text}
        </div>
      )}

      {/* "Add File" Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Create New File</h2>
            <input
              type="text"
              value={newFileNameInput}
              onChange={(e) => setNewFileNameInput(e.target.value)}
              placeholder="e.g., about.html or script.js"
              className="w-full p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFile}
                className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "Delete File" Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-6">Are you sure you want to delete <span className="font-bold text-red-400">{fileToDelete}</span>?</p>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFile}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "Rename File" Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Rename File</h2>
            <p className="mb-4">Renaming <span className="font-bold text-teal-400">{fileToRename}</span></p>
            <input
              type="text"
              value={newFileNameForRename}
              onChange={(e) => setNewFileNameForRename(e.target.value)}
              placeholder="Enter new file name"
              className="w-full p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowRenameModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameFile}
                className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 transition-colors"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right-click Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-50 bg-gray-800 rounded-lg shadow-xl py-2"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <ul className="list-none m-0 p-0">
            <li
              onClick={() => {
                setShowRenameModal(true);
                setFileToRename(contextMenu.fileName);
                setNewFileNameForRename(contextMenu.fileName);
                setContextMenu({ ...contextMenu, visible: false });
              }}
              className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm"
            >
              Rename
            </li>
            <li
              onClick={() => {
                setShowDeleteModal(true);
                setFileToDelete(contextMenu.fileName);
                setContextMenu({ ...contextMenu, visible: false });
              }}
              className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm text-red-400"
            >
              Delete
            </li>
            <li
              onClick={() => handleHideFile(contextMenu.fileName)}
              className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm"
            >
              Hide
            </li>
          </ul>
        </div>
      )}
      
      {/* File Menu (modal overlay) */}
      {showFileMenu && (
        <div ref={fileMenuRef} className="fixed left-0 top-0 bottom-0 bg-gray-800 w-64 p-4 z-40 transition-transform duration-300 ease-in-out transform shadow-2xl">
          <h2 className="text-xl font-bold mb-4 text-teal-400">Files</h2>
          <div className="flex-grow overflow-y-auto">
              {Object.keys(files).filter(fileName => !hiddenFiles.includes(fileName)).map((fileName) => (
                  <div
                    key={fileName}
                    className={`flex items-center justify-between p-2 rounded-lg my-1 transition-colors group cursor-pointer
                               ${activeFile === fileName ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                    onClick={() => { setActiveFile(fileName); setShowFileMenu(false); }}
                    onContextMenu={(e) => handleContextMenu(e, fileName)}
                  >
                      <span className={`font-semibold transition-colors w-full text-left
                                       ${activeFile === fileName
                                           ? 'text-white'
                                           : 'text-gray-400'
                                       }`}
                      >
                          {fileName}
                      </span>
                      <div className="flex gap-2 items-center">
                          <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDeleteModal(true);
                                  setFileToDelete(fileName);
                              }}
                              className={`text-red-400 hover:text-red-500 transition-opacity p-1
                                           ${activeFile === fileName ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          >
                              &times;
                          </button>
                      </div>
                  </div>
              ))}
          </div>
          <div className="mt-4 flex flex-col gap-2">
              <button
                  onClick={handleDownloadProject}
                  disabled={isDownloading}
                  className="flex items-center justify-center p-2 rounded-lg border-2 border-solid border-teal-500 text-white hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  {isDownloading ? (
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                  )}
                  {isDownloading ? 'Bundling...' : 'Download Project (ZIP)'}
              </button>
              <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center justify-center p-2 rounded-lg border-2 border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-teal-500 transition-colors"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add File
              </button>
              <label htmlFor="upload-btn" className="cursor-pointer flex items-center justify-center p-2 rounded-lg border-2 border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-teal-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload File
              </label>
              <input type="file" id="upload-btn" className="hidden" onChange={handleFileUpload} />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gray-900 shadow-md">
        <button
          onClick={() => setShowFileMenu(!showFileMenu)}
          className="p-2 rounded-md hover:bg-gray-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold text-teal-400 text-center">
          emn tools
        </h1>
        <div className="w-12"></div> {/* Spacer to center the title */}
      </div>

      {/* Main 2-Column Layout with Resizer */}
      <div className="flex flex-grow w-full overflow-hidden">
        
        {/* Code Editor Panel */}
        <div className="flex flex-col p-4 overflow-hidden" style={{ width: `${editorWidth}%` }}>
            <label htmlFor="editor" className="text-lg font-semibold mb-2 text-gray-300">
                {activeFile}
            </label>
            <textarea
                id="editor"
                spellCheck="false"
                value={files[activeFile]}
                onChange={handleEditorChange}
                className="flex-1 p-4 rounded-lg bg-gray-800 text-gray-100 border-2 border-gray-700
                           focus:outline-none focus:border-teal-400 transition-colors duration-200
                           font-mono text-sm shadow-lg resize-none"
            />
        </div>

        {/* Resizer Handle */}
        <div 
          ref={resizerRef} 
          onMouseDown={handleMouseDown}
          className="w-2 cursor-ew-resize bg-gray-700 hover:bg-teal-500 transition-colors duration-200"
        ></div>

        {/* Live Preview Panel */}
        <div className="flex flex-col p-4 flex-grow overflow-hidden" style={{ width: `${100 - editorWidth}%` }}>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="preview" className="text-lg font-semibold text-gray-300">
              Live Preview
            </label>
            <div className="flex space-x-2">
                <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors
                                ${previewMode === 'mobile' ? 'bg-teal-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    title="Mobile View"
                >
                    Mobile
                </button>
                <button
                    onClick={() => setPreviewMode('web')}
                    className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors
                                ${previewMode === 'web' ? 'bg-teal-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    title="Web View"
                >
                    Web
                </button>
            </div>
          </div>
          <div className={`relative flex-1 ${previewMode === 'mobile' ? 'flex items-center justify-center' : ''}`}>
            <iframe
              id="preview"
              className={`rounded-lg border-2 border-gray-700 bg-white shadow-lg transition-all duration-300
                          ${previewMode === 'mobile' ? 'w-[375px] h-full mx-auto' : 'w-full h-full'}`}
              title="HTML Live Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
