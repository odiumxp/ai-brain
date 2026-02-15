import { useState, useEffect } from 'react';
import '../styles/PersonaSwitcher.css';

export default function PersonaSwitcher({ userId, onPersonaChange }) {
  const [personas, setPersonas] = useState([]);
  const [activePersona, setActivePersona] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPersona, setNewPersona] = useState({
    name: '',
    description: '',
    system_prompt: '',
    avatar_emoji: '🤖'
  });
  
  const API_URL = 'http://localhost:3000';
  
  useEffect(() => {
    fetchPersonas();
  }, [userId]);
  
  const fetchPersonas = async () => {
    try {
      const response = await fetch(`${API_URL}/api/personas/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setPersonas(data.personas || []);
        
        const active = data.personas.find(p => p.is_active);
        setActivePersona(active);
      }
    } catch (error) {
      console.error('Error fetching personas:', error);
    }
  };
  
  const switchPersona = async (personaId) => {
    try {
      const response = await fetch(`${API_URL}/api/personas/${userId}/switch/${personaId}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setActivePersona(data.persona);
        setIsOpen(false);
        if (onPersonaChange) {
          onPersonaChange(data.persona);
        }
        fetchPersonas();
      }
    } catch (error) {
      console.error('Error switching persona:', error);
    }
  };
  
  const createPersona = async () => {
    if (!newPersona.name.trim()) {
      alert('Please enter a name');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/personas/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPersona)
      });
      
      if (response.ok) {
        setShowCreateModal(false);
        setNewPersona({
          name: '',
          description: '',
          system_prompt: '',
          avatar_emoji: '🤖'
        });
        fetchPersonas();
      }
    } catch (error) {
      console.error('Error creating persona:', error);
    }
  };
  
  const initializeDefaultPersonas = async () => {
    try {
      const response = await fetch(`${API_URL}/api/personas/${userId}/initialize`, {
        method: 'POST'
      });
      
      if (response.ok) {
        fetchPersonas();
      }
    } catch (error) {
      console.error('Error initializing personas:', error);
    }
  };
  
  if (personas.length === 0) {
    return (
      <div className="persona-empty-state">
        <p>No personas created yet</p>
        <button onClick={initializeDefaultPersonas} className="btn-primary">
          Create Default Personas
        </button>
      </div>
    );
  }
  
  return (
    <div className="persona-switcher">
      <button 
        className="persona-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="persona-emoji">{activePersona?.avatar_emoji || '🤖'}</span>
        <span className="persona-name">{activePersona?.name || 'Select Persona'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      
      {isOpen && (
        <div className="persona-dropdown">
          <div className="persona-list">
            {personas.map(persona => (
              <div
                key={persona.persona_id}
                className={`persona-item ${activePersona?.persona_id === persona.persona_id ? 'active' : ''}`}
                onClick={() => switchPersona(persona.persona_id)}
              >
                <span className="persona-emoji">{persona.avatar_emoji}</span>
                <div className="persona-info">
                  <div className="persona-item-name">{persona.name}</div>
                  <div className="persona-description">{persona.description}</div>
                </div>
                {activePersona?.persona_id === persona.persona_id && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
            ))}
          </div>
          
          <div className="persona-actions">
            <button 
              className="btn-create"
              onClick={() => {
                setIsOpen(false);
                setShowCreateModal(true);
              }}
            >
              + Create New Persona
            </button>
          </div>
        </div>
      )}
      
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Persona</h2>
            
            <div className="form-group">
              <label>Emoji</label>
              <input
                type="text"
                value={newPersona.avatar_emoji}
                onChange={(e) => setNewPersona({ ...newPersona, avatar_emoji: e.target.value })}
                maxLength={2}
                placeholder="🤖"
              />
            </div>
            
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={newPersona.name}
                onChange={(e) => setNewPersona({ ...newPersona, name: e.target.value })}
                placeholder="e.g., Coding Assistant"
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={newPersona.description}
                onChange={(e) => setNewPersona({ ...newPersona, description: e.target.value })}
                placeholder="What does this persona help with?"
              />
            </div>
            
            <div className="form-group">
              <label>System Prompt</label>
              <textarea
                value={newPersona.system_prompt}
                onChange={(e) => setNewPersona({ ...newPersona, system_prompt: e.target.value })}
                placeholder="How should this persona behave? (optional)"
                rows={4}
              />
            </div>
            
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={createPersona} className="btn-primary">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
