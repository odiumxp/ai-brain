import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import PersonaSwitcher from './PersonaSwitcher';
import MarkdownRenderer from './MarkdownRenderer';
import 'highlight.js/styles/github-dark.css';
import '../styles/ChatInterface.css';
import '../styles/Sidebar.css';
import '../styles/Markdown.css';
import '../styles/ImageSupport.css';

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ memories: 0, traits: 0 });
  const [personality, setPersonality] = useState({});
  const [lastMemoryAction, setLastMemoryAction] = useState(null);
  const [currentPersona, setCurrentPersona] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const API_URL = 'http://localhost:3000';
  const USER_ID = 'f9364170-b5d7-4239-affd-1eea6ad5dac2';
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Fetch personality traits on mount and after each message
  const fetchPersonality = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat/personality/${USER_ID}`);
      if (response.ok) {
        const data = await response.json();
        setPersonality(data.traits || {});
      }
    } catch (error) {
      console.error('Error fetching personality:', error);
    }
  };
  
  useEffect(() => {
    fetchPersonality();
  }, []);
  
  const sendMessage = async () => {
    if ((!input.trim() && !selectedImage) || loading) return;
    
    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
      image: selectedImage ? selectedImage.preview : null
    };
    setMessages(prev => [...prev, userMessage]);
    
    const messageText = input;
    setInput('');
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setLoading(true);
    
    // Show "Storing memory..." status
    setLastMemoryAction({ type: 'storing', text: messageText, time: new Date() });
    
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: USER_ID,
          message: messageText,
          image: imageToSend ? { data: imageToSend.data, name: imageToSend.name } : undefined
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      const aiMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        metadata: data.metadata
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setStats({
        memories: data.metadata?.memories_retrieved || 0,
        traits: data.metadata?.personality_traits || 0
      });
      
      // Show "Retrieved X memories" status
      setLastMemoryAction({ 
        type: 'retrieved', 
        count: data.metadata?.memories_retrieved || 0,
        time: new Date() 
      });
      
      // Fetch updated personality
      fetchPersonality();
      
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure the backend server is running on port 3000.',
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage({
        data: ev.target.result,
        name: file.name,
        preview: ev.target.result
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const getTraitColor = (value) => {
    if (value >= 7) return '#00e5ff'; // High - cyan
    if (value <= 3) return '#ff4d4d'; // Low - red
    return '#ffd700'; // Medium - gold
  };
  
  const getTraitLabel = (value) => {
    if (value >= 7) return 'HIGH';
    if (value <= 3) return 'LOW';
    return 'MED';
  };
  
  return (
    <div className="chat-layout">
      <div className="chat-container">
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1>Chat</h1>
            <PersonaSwitcher 
              userId={USER_ID} 
              onPersonaChange={(persona) => {
                setCurrentPersona(persona);
                setMessages([]);
              }}
            />
          </div>
          <div className="stats">
            <span className="stat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              </svg>
              {stats.memories} memories
            </span>
            <span className="stat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
              {stats.traits} traits
            </span>
          </div>
        </div>
        
        <div className="messages-container">
          {messages.length === 0 && (
            <div className="welcome-message">
              <h2>Welcome to AI Brain!</h2>
              <p>I'm an AI with persistent memory and evolving personality.</p>
              <p>Start chatting and watch me develop my own unique character through our interactions.</p>
              <div className="feature-list">
                <div className="feature">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  I remember every conversation
                </div>
                <div className="feature">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  My personality evolves naturally
                </div>
                <div className="feature">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  I form emotional connections
                </div>
                <div className="feature">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  I never forget who you are
                </div>
              </div>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-header">
                <span className="role-label">
                  {msg.role === 'user' ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      YOU
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      AI
                    </>
                  )}
                </span>
                <span className="timestamp">
                  {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                </span>
              </div>
              {msg.image && (
                <div className="message-image">
                  <img src={msg.image} alt="Uploaded" />
                </div>
              )}
              <div className={`message-content ${msg.error ? 'error' : ''}`}>
                {msg.role === 'assistant' && !msg.error ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  msg.content
                )}
              </div>
              {msg.metadata && msg.metadata.memories_retrieved > 0 && (
                <div className="message-meta">
                  Referenced {msg.metadata.memories_retrieved} past {msg.metadata.memories_retrieved === 1 ? 'memory' : 'memories'}
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="message assistant">
              <div className="message-header">
                <span className="role-label">🤖 AI</span>
              </div>
              <div className="message-content loading">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="input-container">
          {selectedImage && (
            <div className="image-preview">
              <img src={selectedImage.preview} alt="Preview" />
              <span className="image-name">{selectedImage.name}</span>
              <button className="remove-image" onClick={() => setSelectedImage(null)}>&times;</button>
            </div>
          )}
          <div className="input-row">
            <button
              className="image-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              title="Attach image"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
              disabled={loading}
              rows="3"
            />
            <button onClick={sendMessage} disabled={loading || (!input.trim() && !selectedImage)}>
              {loading ? '...' : 'SEND'}
            </button>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
        </div>
      </div>
      
      {/* Live Stats Sidebar */}
      <div className="stats-sidebar">
        <div className="stats-section">
          <h3>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '6px'}}>
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
            PERSONALITY
          </h3>
          <div className="traits-list">
            {Object.keys(personality).length > 0 ? (
              Object.entries(personality).map(([trait, value]) => (
                <div key={trait} className="trait-item">
                  <div className="trait-header">
                    <span className="trait-name">{trait.toUpperCase()}</span>
                    <span 
                      className="trait-level" 
                      style={{ color: getTraitColor(value) }}
                    >
                      {getTraitLabel(value)}
                    </span>
                  </div>
                  <div className="trait-bar">
                    <div 
                      className="trait-fill" 
                      style={{ 
                        width: `${(value / 10) * 100}%`,
                        background: getTraitColor(value)
                      }}
                    />
                  </div>
                  <div className="trait-value">{value.toFixed(2)}/10</div>
                </div>
              ))
            ) : (
              <div className="no-data">Loading traits...</div>
            )}
          </div>
        </div>
        
        <div className="stats-section">
          <h3>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '6px'}}>
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            </svg>
            MEMORY ACTIVITY
          </h3>
          {lastMemoryAction ? (
            <div className="memory-activity">
              {lastMemoryAction.type === 'storing' && (
                <div className="activity-item storing">
                  <div className="activity-icon">📝</div>
                  <div className="activity-text">
                    <div className="activity-label">Storing memory...</div>
                    <div className="activity-detail">
                      {lastMemoryAction.text.substring(0, 50)}
                      {lastMemoryAction.text.length > 50 ? '...' : ''}
                    </div>
                  </div>
                </div>
              )}
              {lastMemoryAction.type === 'retrieved' && (
                <div className="activity-item retrieved">
                  <div className="activity-icon">🔍</div>
                  <div className="activity-text">
                    <div className="activity-label">Retrieved memories</div>
                    <div className="activity-detail">
                      Found {lastMemoryAction.count} relevant {lastMemoryAction.count === 1 ? 'memory' : 'memories'}
                    </div>
                  </div>
                </div>
              )}
              <div className="activity-time">
                {formatDistanceToNow(lastMemoryAction.time, { addSuffix: true })}
              </div>
            </div>
          ) : (
            <div className="no-data">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  );
}
