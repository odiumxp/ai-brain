import { useState, useEffect } from 'react';
import '../styles/Learning.css';

export default function LearningMode() {
  const [view, setView] = useState('dashboard'); // dashboard, study, quiz
  const [stats, setStats] = useState(null);
  const [dueItems, setDueItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const API_URL = 'http://localhost:3000';
  const USER_ID = 'f9364170-b5d7-4239-affd-1eea6ad5dac2';
  
  useEffect(() => {
    fetchStats();
    fetchDueItems();
  }, []);
  
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/learning/${USER_ID}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  const fetchDueItems = async () => {
    try {
      const response = await fetch(`${API_URL}/api/learning/${USER_ID}/due?limit=20`);
      if (response.ok) {
        const data = await response.json();
        setDueItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching due items:', error);
    }
  };
  
  const generateQuiz = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/learning/${USER_ID}/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 5 })
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Generated ${data.questions?.length || 0} new quiz questions!`);
        fetchDueItems();
        fetchStats();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to generate quiz');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Error generating quiz. Make sure you\'ve chatted with the Learning Tutor first!');
    } finally {
      setLoading(false);
    }
  };
  
  const startStudySession = async () => {
    if (dueItems.length === 0) {
      alert('No items due for review!');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/learning/${USER_ID}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        setCurrentIndex(0);
        setCurrentItem(dueItems[0]);
        setView('study');
        setSessionStats({ reviewed: 0, correct: 0 });
        setShowAnswer(false);
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };
  
  const submitAnswer = async (correct) => {
    try {
      await fetch(`${API_URL}/api/learning/answer/${currentItem.item_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correct })
      });
      
      setSessionStats(prev => ({
        reviewed: prev.reviewed + 1,
        correct: prev.correct + (correct ? 1 : 0)
      }));
      
      // Move to next item
      if (currentIndex < dueItems.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setCurrentItem(dueItems[currentIndex + 1]);
        setShowAnswer(false);
      } else {
        // Session complete
        await fetch(`${API_URL}/api/learning/session/${sessionId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemsReviewed: sessionStats.reviewed + 1,
            itemsCorrect: sessionStats.correct + (correct ? 1 : 0),
            durationMinutes: 5
          })
        });
        
        alert(`Session complete! ${sessionStats.correct + (correct ? 1 : 0)}/${sessionStats.reviewed + 1} correct`);
        setView('dashboard');
        fetchStats();
        fetchDueItems();
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };
  
  const getMasteryLabel = (level) => {
    const labels = ['New', 'Learning', 'Familiar', 'Confident', 'Mastered', 'Expert'];
    return labels[level] || 'Unknown';
  };
  
  const getMasteryColor = (level) => {
    const colors = ['#ff4d4d', '#ff9f43', '#ffd700', '#51cf66', '#339af0', '#7950f2'];
    return colors[level] || '#999';
  };
  
  if (loading) {
    return (
      <div className="learning-container">
        <div className="learning-loading">
          <div className="loading-spinner"></div>
          <p>Generating quiz questions...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="learning-container">
      <div className="learning-header">
        <h1>📚 Learning Mode</h1>
        <div className="header-actions">
          <button 
            onClick={() => setView('dashboard')} 
            className={`btn ${view === 'dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </button>
          <button onClick={generateQuiz} className="btn btn-primary">
            Generate Quiz
          </button>
        </div>
      </div>
      
      {view === 'dashboard' && (
        <div className="learning-dashboard">
          {/* Stats Overview */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats?.items?.total_items || 0}</div>
              <div className="stat-label">Total Items</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.items?.due_today || 0}</div>
              <div className="stat-label">Due Today</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {stats?.items?.avg_mastery ? parseFloat(stats.items.avg_mastery).toFixed(1) : '0.0'}
              </div>
              <div className="stat-label">Avg Mastery</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.sessions?.total_sessions || 0}</div>
              <div className="stat-label">Sessions</div>
            </div>
          </div>
          
          {/* Study Button */}
          {dueItems.length > 0 && (
            <div className="study-prompt">
              <h2>Ready to study?</h2>
              <p>{dueItems.length} items are due for review</p>
              <button onClick={startStudySession} className="btn-study">
                Start Study Session
              </button>
            </div>
          )}
          
          {dueItems.length === 0 && (
            <div className="empty-state">
              <p>No items due for review!</p>
              <p>Generate a quiz from your Learning Tutor conversations.</p>
            </div>
          )}
          
          {/* Mastery Distribution */}
          {stats?.mastery && stats.mastery.length > 0 && (
            <div className="mastery-section">
              <h3>Mastery Distribution</h3>
              <div className="mastery-bars">
                {stats.mastery.map(m => (
                  <div key={m.mastery_level} className="mastery-bar">
                    <span className="mastery-label">{getMasteryLabel(m.mastery_level)}</span>
                    <div className="mastery-progress">
                      <div 
                        className="mastery-fill" 
                        style={{ 
                          width: `${(m.count / stats.items.total_items) * 100}%`,
                          background: getMasteryColor(m.mastery_level)
                        }}
                      />
                    </div>
                    <span className="mastery-count">{m.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {view === 'study' && currentItem && (
        <div className="study-view">
          <div className="study-header">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentIndex + 1) / dueItems.length) * 100}%` }}
              />
            </div>
            <div className="progress-text">
              Question {currentIndex + 1} of {dueItems.length}
            </div>
          </div>
          
          <div className="study-card">
            <div className="card-topic">{currentItem.topic}</div>
            <div className="card-difficulty">{currentItem.difficulty}</div>
            
            <div className="question-text">
              {currentItem.question.question}
            </div>
            
            {currentItem.question.options && (
              <div className="options-list">
                {currentItem.question.options.map((option, index) => (
                  <button 
                    key={index}
                    className={`option-btn ${showAnswer && index === currentItem.question.correct ? 'correct' : ''}`}
                    onClick={() => setShowAnswer(true)}
                    disabled={showAnswer}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </button>
                ))}
              </div>
            )}
            
            {showAnswer && (
              <div className="answer-section">
                <div className="answer-label">Answer:</div>
                <div className="answer-text">{currentItem.answer}</div>
                
                <div className="answer-actions">
                  <button onClick={() => submitAnswer(false)} className="btn-wrong">
                    ❌ Got it wrong
                  </button>
                  <button onClick={() => submitAnswer(true)} className="btn-correct">
                    ✅ Got it right
                  </button>
                </div>
              </div>
            )}
            
            {!showAnswer && (
              <button onClick={() => setShowAnswer(true)} className="btn-reveal">
                Show Answer
              </button>
            )}
          </div>
          
          <div className="session-stats">
            <span>Reviewed: {sessionStats.reviewed}</span>
            <span>Correct: {sessionStats.correct}</span>
            <span>Accuracy: {sessionStats.reviewed > 0 ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100) : 0}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
