import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from '../Icons';

export default function SnippetsTab() {
  const [clipboard, setClipboard] = useState({ type: 'text', data: '' });
  const [snippets, setSnippets] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [editingSnippet, setEditingSnippet] = useState(null);

  useEffect(() => {
    loadSnippets();
    updateClipboard();
    const interval = setInterval(updateClipboard, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadSnippets = async () => {
    const data = await window.notchAPI?.getSnippets() || [];
    setSnippets(data);
  };

  const updateClipboard = async () => {
    const data = await window.notchAPI?.readClipboard();
    if (data) setClipboard(data);
  };

  const saveSnippets = async (newSnippets) => {
    setSnippets(newSnippets);
    await window.notchAPI?.saveSnippets(newSnippets);
  };

  const copySnippet = async (snippet) => {
    await window.notchAPI?.writeClipboard(snippet.body);
    updateClipboard();
  };

  const handleSave = () => {
    if (!title.trim() || !body.trim()) return;
    
    if (editingSnippet) {
      const updated = snippets.map(s => 
        s.id === editingSnippet.id ? { ...s, title, body } : s
      );
      saveSnippets(updated);
    } else {
      const newSnippet = {
        id: Date.now(),
        icon: '📝',
        title,
        body
      };
      saveSnippets([...snippets, newSnippet]);
    }
    closeModal();
  };

  const openModal = (snippet = null) => {
    if (snippet) {
      setEditingSnippet(snippet);
      setTitle(snippet.title);
      setBody(snippet.body);
    } else {
      setEditingSnippet(null);
      setTitle('');
      setBody('');
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSnippet(null);
    setTitle('');
    setBody('');
  };

  const handleDelete = (snippetId) => {
    const updated = snippets.filter(s => s.id !== snippetId);
    saveSnippets(updated);
    closeModal();
  };

  const saveFromClipboard = async () => {
    if (clipboard.data && clipboard.type === 'text') {
      const newSnippet = {
        id: Date.now(),
        icon: '📋',
        title: `Clipboard ${new Date().toLocaleTimeString()}`,
        body: clipboard.data.substring(0, 500)
      };
      saveSnippets([...snippets, newSnippet]);
    }
  };

  return (
    <div className="snippets-container">
      {/* Clipboard Section */}
      <motion.div 
        className="clipboard-section"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="section-header">
          <div className="section-title">📋 Clipboard</div>
          {clipboard.data && clipboard.type === 'text' && (
            <motion.button 
              className="save-clipboard-btn"
              onClick={saveFromClipboard}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Save to snippets"
            >
              <Plus size={14} />
            </motion.button>
          )}
        </div>
        <div className="clipboard-card">
          <span className="clipboard-status">✓ Copied</span>
          <div className="clipboard-content">
            {clipboard.type === 'image' ? (
              <img src={clipboard.data} alt="clipboard" style={{ maxWidth: '100%', maxHeight: 80, borderRadius: 4 }} />
            ) : (
              clipboard.data?.substring(0, 200) || 'Clipboard is empty'
            )}
            {clipboard.data?.length > 200 && '...'}
          </div>
        </div>
      </motion.div>

      {/* Snippets Section */}
      <motion.div 
        className="snippets-section"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="section-header">
          <div className="section-title">📝 Snippets</div>
          <motion.button 
            className="add-snippet-inline"
            onClick={() => openModal()}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Plus size={16} />
          </motion.button>
        </div>
        <div className="snippets-grid">
          {snippets.length === 0 ? (
            <div className="empty-state">
              <span>No snippets yet</span>
              <button onClick={() => openModal()}>Add your first snippet</button>
            </div>
          ) : (
            snippets.map((snippet, i) => (
              <motion.div
                key={snippet.id}
                className="snippet-item"
                onClick={() => copySnippet(snippet)}
                onContextMenu={(e) => { e.preventDefault(); openModal(snippet); }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="snippet-title">
                  <span>{snippet.icon}</span>
                  {snippet.title}
                </div>
                <div className="snippet-preview">{snippet.body}</div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <input
                type="text"
                placeholder="Snippet title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
              <textarea
                placeholder="Snippet content..."
                value={body}
                onChange={e => setBody(e.target.value)}
              />
              <div className="modal-actions">
                {editingSnippet && (
                  <button className="danger" onClick={() => handleDelete(editingSnippet.id)}>Delete</button>
                )}
                <div style={{ flex: 1 }} />
                <button className="secondary" onClick={closeModal}>Cancel</button>
                <button className="primary" onClick={handleSave}>Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
