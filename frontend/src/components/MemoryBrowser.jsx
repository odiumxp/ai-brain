import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import '../styles/MemoryBrowser.css';

export default function MemoryBrowser() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterImportance, setFilterImportance] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [stats, setStats] = useState({ total: 0, avgImportance: 0 });
  
  const API_URL = 'http://localhost:3000';
  const USER_ID = 'f9364170-b5d7-4239-affd-1eea6ad5dac2';
  
  useEffect(() => {
    fetchMemories();
    fetchStats();
  }, []);
  
  const fetchMemories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/chat/memories/${USER_ID}`);
      if (response.ok) {
        const data = await response.json();
        setMemories(data.memories || []);
      }
    } catch (error) {
      console.error('Error fetching memories:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat/memory-stats/${USER_ID}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  const deleteMemory = async (memoryId) => {
    if (!confirm('Are you sure you want to delete this memory? This cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/chat/memories/${memoryId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setMemories(memories.filter(m => m.memory_id !== memoryId));
        setSelectedMemory(null);
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
      alert('Failed to delete memory');
    }
  };
  
  const togglePin = async (memoryId, currentPinned) => {
    try {
      const response = await fetch(`${API_URL}/api/chat/memories/${memoryId}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !currentPinned })
      });
      
      if (response.ok) {
        setMemories(memories.map(m => 
          m.memory_id === memoryId ? { ...m, pinned: !currentPinned } : m
        ));
        if (selectedMemory?.memory_id === memoryId) {
          setSelectedMemory({ ...selectedMemory, pinned: !currentPinned });
        }
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };
  
  const getFilteredMemories = () => {
    let filtered = [...memories];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(m => {
        const conv = typeof m.conversation_text === 'string' 
          ? JSON.parse(m.conversation_text) 
          : m.conversation_text;
        const text = `${conv.user} ${conv.ai}`.toLowerCase();
        return text.includes(searchQuery.toLowerCase());
      });
    }
    
    // Importance filter
    if (filterImportance !== 'all') {
      if (filterImportance === 'high') {
        filtered = filtered.filter(m => m.importance_score >= 1.5);
      } else if (filterImportance === 'medium') {
        filtered = filtered.filter(m => m.importance_score >= 0.8 && m.importance_score < 1.5);
      } else if (filterImportance === 'low') {
        filtered = filtered.filter(m => m.importance_score < 0.8);
      }
    }
    
    // Sort
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else if (sortBy === 'importance') {
      filtered.sort((a, b) => b.importance_score - a.importance_score);
    } else if (sortBy === 'accessed') {
      filtered.sort((a, b) => b.access_count - a.access_count);
    }
    
    // Pinned always on top
    const pinned = filtered.filter(m => m.pinned);
    const unpinned = filtered.filter(m => !m.pinned);
    
    return [...pinned, ...unpinned];
  };
  
  const getImportanceColor = (score) => {
    if (score >= 1.5) return '#00e5ff';
    if (score >= 0.8) return '#ffd700';
    return '#ff4d4d';
  };
  
  const getImportanceLabel = (score) => {
    if (score >= 1.5) return 'HIGH';
    if (score >= 0.8) return 'MEDIUM';
    return 'LOW';
  };
  
  const filteredMemories = getFilteredMemories();
  
  return (
    <div className="memory-browser">
      <div className="browser-header">
        <h1>Memories</h1>
        <div className="browser-stats">
          <div className="stat-item">
            <span className="stat-value">{stats.total || 0}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.avgImportance?.toFixed(2) || '0.00'}</span>
            <span className="stat-label">Avg Score</span>
          </div>
        </div>
      </div>
      
      <div className="browser-controls">
        <input
          type="text"
          className="search-input"
          placeholder="Search memories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <select 
          className="filter-select"
          value={filterImportance}
          onChange={(e) => setFilterImportance(e.target.value)}
        >
          <option value="all">All Importance</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        
        <select 
          className="filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest First</option>
          <option value="importance">Importance</option>
          <option value="accessed">Most Accessed</option>
        </select>
      </div>
      
      <div className="browser-content">
        <div className="memories-list">
          {loading ? (
            <div className="loading-state">Loading memories...</div>
          ) : filteredMemories.length === 0 ? (
            <div className="empty-state">
              {searchQuery ? 'No memories found matching your search' : 'No memories yet'}
            </div>
          ) : (
            filteredMemories.map(memory => {
              const conv = typeof memory.conversation_text === 'string'
                ? JSON.parse(memory.conversation_text)
                : memory.conversation_text;
              
              return (
                <div
                  key={memory.memory_id}
                  className={`memory-card ${selectedMemory?.memory_id === memory.memory_id ? 'selected' : ''} ${memory.pinned ? 'pinned' : ''}`}
                  onClick={() => setSelectedMemory(memory)}
                >
                  <div className="memory-header">
                    <span className="memory-time">
                      {format(new Date(memory.timestamp), 'MMM d, yyyy h:mm a')}
                    </span>
                    <div className="memory-badges">
                      {memory.pinned && <span className="badge pinned-badge">📌 PINNED</span>}
                      <span 
                        className="badge importance-badge"
                        style={{ background: getImportanceColor(memory.importance_score) }}
                      >
                        {getImportanceLabel(memory.importance_score)}
                      </span>
                    </div>
                  </div>
                  <div className="memory-preview">
                    <div className="preview-label">You:</div>
                    <div className="preview-text">{conv.user.substring(0, 100)}{conv.user.length > 100 ? '...' : ''}</div>
                  </div>
                  <div className="memory-footer">
                    <span className="access-count">🔍 Accessed {memory.access_count} times</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="memory-detail">
          {selectedMemory ? (
            <>
              <div className="detail-header">
                <h2>Memory Details</h2>
                <div className="detail-actions">
                  <button
                    className={`action-btn ${selectedMemory.pinned ? 'active' : ''}`}
                    onClick={() => togglePin(selectedMemory.memory_id, selectedMemory.pinned)}
                    title={selectedMemory.pinned ? 'Unpin memory' : 'Pin memory'}
                  >
                    📌 {selectedMemory.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => deleteMemory(selectedMemory.memory_id)}
                    title="Delete memory"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
              
              <div className="detail-content">
                {(() => {
                  const conv = typeof selectedMemory.conversation_text === 'string'
                    ? JSON.parse(selectedMemory.conversation_text)
                    : selectedMemory.conversation_text;
                  
                  return (
                    <>
                      <div className="detail-section">
                        <div className="section-label">Timestamp</div>
                        <div className="section-value">
                          {format(new Date(selectedMemory.timestamp), 'MMMM d, yyyy h:mm:ss a')}
                          <span className="time-ago">
                            ({formatDistanceToNow(new Date(selectedMemory.timestamp), { addSuffix: true })})
                          </span>
                        </div>
                      </div>
                      
                      <div className="detail-section">
                        <div className="section-label">You Said</div>
                        <div className="section-value conversation-text">{conv.user}</div>
                      </div>
                      
                      <div className="detail-section">
                        <div className="section-label">AI Responded</div>
                        <div className="section-value conversation-text">{conv.ai}</div>
                      </div>
                      
                      <div className="detail-section">
                        <div className="section-label">Importance Score</div>
                        <div className="section-value">
                          <span style={{ color: getImportanceColor(selectedMemory.importance_score) }}>
                            {selectedMemory.importance_score.toFixed(2)} / 3.00
                          </span>
                          <span className="importance-label">
                            ({getImportanceLabel(selectedMemory.importance_score)})
                          </span>
                        </div>
                      </div>
                      
                      <div className="detail-section">
                        <div className="section-label">Access Count</div>
                        <div className="section-value">
                          Retrieved {selectedMemory.access_count} times
                          {selectedMemory.last_accessed && (
                            <span className="time-ago">
                              (last: {formatDistanceToNow(new Date(selectedMemory.last_accessed), { addSuffix: true })})
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {selectedMemory.emotional_context && (
                        <div className="detail-section">
                          <div className="section-label">Emotional Context</div>
                          <div className="section-value">
                            {(() => {
                              const emotions = typeof selectedMemory.emotional_context === 'string'
                                ? JSON.parse(selectedMemory.emotional_context)
                                : selectedMemory.emotional_context;
                              
                              return Object.entries(emotions)
                                .filter(([_, value]) => value > 0)
                                .map(([emotion, value]) => (
                                  <span key={emotion} className="emotion-tag">
                                    {emotion}: {(value * 100).toFixed(0)}%
                                  </span>
                                ));
                            })()}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Select a memory to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
