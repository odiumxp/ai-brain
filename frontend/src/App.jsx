import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import MemoryBrowser from './components/MemoryBrowser';
import Insights from './components/Insights';
import LearningMode from './components/LearningMode';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('chat');
  
  return (
    <div className="app">
      <nav className="app-nav">
        <div className="nav-brand">
          <svg className="logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="logo-text">AI Brain</span>
        </div>
        <div className="nav-links">
          <button 
            className={`nav-btn ${currentView === 'chat' ? 'active' : ''}`}
            onClick={() => setCurrentView('chat')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Chat
          </button>
          <button 
            className={`nav-btn ${currentView === 'memories' ? 'active' : ''}`}
            onClick={() => setCurrentView('memories')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Memories
          </button>
          <button 
            className={`nav-btn ${currentView === 'insights' ? 'active' : ''}`}
            onClick={() => setCurrentView('insights')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Insights
          </button>
          <button 
            className={`nav-btn ${currentView === 'learning' ? 'active' : ''}`}
            onClick={() => setCurrentView('learning')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            Learning
          </button>
        </div>
      </nav>
      
      <main className="app-main">
        {currentView === 'chat' && <ChatInterface />}
        {currentView === 'memories' && <MemoryBrowser />}
        {currentView === 'insights' && <Insights />}
        {currentView === 'learning' && <LearningMode />}
      </main>
    </div>
  );
}

export default App;
