import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrayTab() {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    const data = await window.notchAPI?.getTrayFiles() || [];
    setFiles(data);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles = droppedFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      path: file.path,
      type: getFileType(file.name),
      size: formatSize(file.size),
      icon: getFileIcon(file.name)
    }));

    const updated = [...files, ...newFiles];
    setFiles(updated);
    await window.notchAPI?.saveTrayFiles(updated);
  };

  const getFileType = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) return 'audio';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx', 'txt', 'rtf', 'md'].includes(ext)) return 'document';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css'].includes(ext)) return 'code';
    return 'file';
  };

  const getFileIcon = (name) => {
    const type = getFileType(name);
    const icons = {
      image: '🖼️',
      video: '🎬',
      audio: '🎵',
      pdf: '📕',
      document: '📄',
      archive: '📦',
      code: '💻',
      file: '📁'
    };
    return icons[type] || '📁';
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const openFile = async (file, e) => {
    if (e) e.stopPropagation();
    await window.notchAPI?.openFile(file.path);
  };

  const toggleSelectFile = (id) => {
    setSelectedFiles(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const removeFile = async (id, e) => {
    if (e) e.stopPropagation();
    const updated = files.filter(f => f.id !== id);
    setFiles(updated);
    setSelectedFiles(prev => prev.filter(fid => fid !== id));
    await window.notchAPI?.saveTrayFiles(updated);
  };

  const clearAll = async () => {
    setFiles([]);
    setSelectedFiles([]);
    await window.notchAPI?.saveTrayFiles([]);
  };

  const openAirDrop = async () => {
    await window.notchAPI?.openAirDrop();
  };

  const shareSelectedViaAirDrop = async () => {
    const selectedPaths = files
      .filter(f => selectedFiles.includes(f.id))
      .map(f => f.path);
    await window.notchAPI?.shareViaAirDrop(selectedPaths);
  };

  const addFilesFromDialog = async () => {
    const result = await window.notchAPI?.openFileDialog();
    if (result && result.length > 0) {
      const newFiles = result.map(fileInfo => {
        const name = typeof fileInfo === 'string' ? fileInfo.split('/').pop() : fileInfo.name;
        const path = typeof fileInfo === 'string' ? fileInfo : fileInfo.path;
        const size = typeof fileInfo === 'object' && fileInfo.size ? formatSize(fileInfo.size) : '--';
        return {
          id: Date.now() + Math.random(),
          name,
          path,
          type: getFileType(name),
          size,
          icon: getFileIcon(name)
        };
      });
      const updated = [...files, ...newFiles];
      setFiles(updated);
      await window.notchAPI?.saveTrayFiles(updated);
    }
  };

  return (
    <div className="tray-container">
      {/* AirDrop Section */}
      <motion.div 
        className="airdrop-section"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="section-title">📡 AirDrop</div>
        <motion.div 
          className="airdrop-card"
          onClick={openAirDrop}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="airdrop-icon">📲</div>
          <p>Open AirDrop</p>
          <small>Share files nearby</small>
        </motion.div>
        
        {selectedFiles.length > 0 && (
          <motion.button 
            className="share-btn"
            onClick={shareSelectedViaAirDrop}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Share {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} via AirDrop
          </motion.button>
        )}
      </motion.div>

      {/* Files Tray */}
      <motion.div 
        className="files-section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="section-header">
          <div className="section-title">📂 Files Tray</div>
          <div className="tray-actions">
            <button className="add-btn" onClick={addFilesFromDialog}>+ Add</button>
            {files.length > 0 && (
              <button className="clear-btn" onClick={clearAll}>Clear All</button>
            )}
          </div>
        </div>

        <motion.div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          animate={{ 
            borderColor: isDragging ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
            backgroundColor: isDragging ? 'rgba(10, 132, 255, 0.1)' : 'transparent'
          }}
        >
          {files.length === 0 ? (
            <div className="drop-placeholder">
              <span>📥</span>
              <p>Drop files here</p>
              <small>Or click Add to browse</small>
            </div>
          ) : (
            <div className="files-grid">
              <AnimatePresence>
                {files.map((file, i) => (
                  <motion.div
                    key={file.id}
                    className={`file-item ${selectedFiles.includes(file.id) ? 'selected' : ''}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => toggleSelectFile(file.id)}
                    onDoubleClick={(e) => openFile(file, e)}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="file-icon">{file.icon}</div>
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">{file.size}</div>
                    <motion.button
                      className="remove-btn"
                      onClick={(e) => removeFile(file.id, e)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      ×
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
