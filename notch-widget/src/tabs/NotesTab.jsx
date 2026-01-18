import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Search } from '../Icons';

export default function NotesTab() {
  const [notes, setNotes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest, alpha

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const data = await window.notchAPI?.getNotes() || [];
    if (data.length === 0) {
      // Sample notes
      const samples = [
        { id: 1, icon: '📄', title: 'Meeting Notes - Q4 Planning', body: 'Discuss budget allocation for new projects. Review team performance metrics...' },
        { id: 2, icon: '🏠', title: 'Weekend Project Ideas', body: 'Build a small herb garden on the balcony. Organize photo albums from summer trip...' },
        { id: 3, icon: '📚', title: 'Book Recommendations', body: 'The Design of Everyday Things - Don Norman. Atomic Habits - James Clear...' },
      ];
      setNotes(samples);
    } else {
      setNotes(data);
    }
  };

  const saveNotes = async (newNotes) => {
    setNotes(newNotes);
    await window.notchAPI?.saveNotes(newNotes);
  };

  const openModal = (note = null) => {
    if (note) {
      setEditingNote(note);
      setTitle(note.title);
      setBody(note.body);
    } else {
      setEditingNote(null);
      setTitle('');
      setBody('');
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingNote(null);
    setTitle('');
    setBody('');
  };

  const handleSave = () => {
    if (!title.trim()) return;

    if (editingNote) {
      const updated = notes.map(n => 
        n.id === editingNote.id ? { ...n, title, body } : n
      );
      saveNotes(updated);
    } else {
      const newNote = {
        id: Date.now(),
        icon: '📄',
        title,
        body
      };
      saveNotes([...notes, newNote]);
    }
    closeModal();
  };

  const handleDelete = (noteId) => {
    const updated = notes.filter(n => n.id !== noteId);
    saveNotes(updated);
    closeModal();
  };

  const toggleSort = () => {
    const orders = ['newest', 'oldest', 'alpha'];
    const currentIndex = orders.indexOf(sortOrder);
    setSortOrder(orders[(currentIndex + 1) % orders.length]);
  };

  const getSortedAndFilteredNotes = () => {
    let filtered = notes;
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = notes.filter(n => 
        n.title.toLowerCase().includes(query) || 
        n.body.toLowerCase().includes(query)
      );
    }
    
    // Sort
    return [...filtered].sort((a, b) => {
      if (sortOrder === 'newest') return b.id - a.id;
      if (sortOrder === 'oldest') return a.id - b.id;
      return a.title.localeCompare(b.title);
    });
  };

  const getSortIcon = () => {
    if (sortOrder === 'newest') return '↓';
    if (sortOrder === 'oldest') return '↑';
    return 'A-Z';
  };

  const icons = ['📄', '📝', '💡', '🎯', '🏠', '📚', '🔖', '⭐'];

  return (
    <div className="notes-container">
      {/* Search bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            className="notes-search"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="notes-grid">
        {getSortedAndFilteredNotes().map((note, i) => (
          <motion.div
            key={note.id}
            className="note-card"
            onClick={() => openModal(note)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <div className="note-title">
              <span className="note-icon">{note.icon}</span>
              {note.title}
            </div>
            <div className="note-body">{note.body}</div>
          </motion.div>
        ))}
      </div>

      <div className="notes-actions">
        <motion.button 
          className={`action-btn ${showSearch ? 'active' : ''}`} 
          onClick={() => setShowSearch(!showSearch)}
          whileTap={{ scale: 0.9 }}
          title="Search notes"
        >
          🔍
        </motion.button>
        <motion.button 
          className="action-btn" 
          onClick={toggleSort}
          whileTap={{ scale: 0.9 }}
          title={`Sort: ${sortOrder}`}
        >
          {getSortIcon()}
        </motion.button>
        <motion.button className="action-btn primary" onClick={() => openModal()} whileTap={{ scale: 0.9 }}>
          <Plus size={18} />
        </motion.button>
      </div>

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
                placeholder="Note title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
              <textarea
                placeholder="Write your note..."
                value={body}
                onChange={e => setBody(e.target.value)}
              />
              <div className="modal-actions">
                {editingNote && (
                  <button className="danger" onClick={() => handleDelete(editingNote.id)}>Delete</button>
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
