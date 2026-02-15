import { useState, useEffect } from 'react';
import '../styles/Insights.css';

export default function Insights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  
  const API_URL = 'http://localhost:3000';
  const USER_ID = 'f9364170-b5d7-4239-affd-1eea6ad5dac2';
  
  useEffect(() => {
    fetchInsights();
  }, [timeRange]);
  
  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/insights/${USER_ID}?days=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getMoodEmoji = (mood) => {
    const emojis = {
      joy: '😊',
      sadness: '😔',
      anger: '😠',
      fear: '😰',
      surprise: '😲',
      neutral: '😐'
    };
    return emojis[mood] || '😐';
  };
  
  const getTrendIcon = (trend) => {
    if (trend === 'improving') return '📈';
    if (trend === 'declining') return '📉';
    return '➡️';
  };
  
  if (loading) {
    return (
      <div className="insights-container">
        <div className="insights-loading">
          <div className="loading-spinner"></div>
          <p>Analyzing your conversations...</p>
        </div>
      </div>
    );
  }
  
  if (!insights) {
    return (
      <div className="insights-container">
        <div className="insights-empty">
          <p>Unable to load insights</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="insights-container">
      <div className="insights-header">
        <h1>AI Insights</h1>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(parseInt(e.target.value))}
          className="time-range-select"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
      </div>
      
      <div className="insights-grid">
        {/* Stats Cards */}
        <div className="insight-card stats-card">
          <h3>Conversation Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{insights.stats.total_conversations || 0}</div>
              <div className="stat-label">Total Conversations</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{insights.stats.last_week || 0}</div>
              <div className="stat-label">Last 7 Days</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{insights.stats.last_month || 0}</div>
              <div className="stat-label">Last 30 Days</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {parseFloat(insights.stats.avg_importance || 0).toFixed(1)}
              </div>
              <div className="stat-label">Avg Importance</div>
            </div>
          </div>
        </div>
        
        {/* Mood Analysis */}
        <div className="insight-card mood-card">
          <h3>Mood Analysis</h3>
          <div className="mood-overview">
            <div className="mood-main">
              <span className="mood-emoji">{getMoodEmoji(insights.mood.overall)}</span>
              <div>
                <div className="mood-label">{insights.mood.overall}</div>
                <div className="mood-trend">
                  {getTrendIcon(insights.mood.trend)} {insights.mood.trend}
                </div>
              </div>
            </div>
          </div>
          <div className="mood-summary">{insights.mood.summary}</div>
          <div className="emotions-breakdown">
            {Object.entries(insights.mood.emotions || {}).map(([emotion, value]) => (
              <div key={emotion} className="emotion-bar">
                <span className="emotion-name">{emotion}</span>
                <div className="emotion-progress">
                  <div 
                    className="emotion-fill" 
                    style={{ width: `${parseFloat(value) * 100}%` }}
                  />
                </div>
                <span className="emotion-value">{(parseFloat(value) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Topics */}
        <div className="insight-card topics-card">
          <h3>What You Talk About Most</h3>
          <p className="card-summary">{insights.topics.summary}</p>
          <div className="topics-list">
            {insights.topics.topics && insights.topics.topics.length > 0 ? (
              insights.topics.topics.map((topic, index) => (
                <div key={index} className="topic-item">
                  <div className="topic-header">
                    <span className="topic-name">{topic.name}</span>
                    <span className={`topic-frequency ${topic.frequency}`}>
                      {topic.frequency}
                    </span>
                  </div>
                  <p className="topic-description">{topic.description}</p>
                </div>
              ))
            ) : (
              <p className="no-data">Chat more to see topic analysis</p>
            )}
          </div>
        </div>
        
        {/* Behavior Patterns */}
        <div className="insight-card patterns-card">
          <h3>Behavior Patterns</h3>
          <p className="card-summary">{insights.patterns.summary}</p>
          <div className="patterns-list">
            {insights.patterns.patterns && insights.patterns.patterns.length > 0 ? (
              insights.patterns.patterns.map((pattern, index) => (
                <div key={index} className="pattern-item">
                  <div className="pattern-frequency">{pattern.frequency}</div>
                  <div className="pattern-text">{pattern.pattern}</div>
                </div>
              ))
            ) : (
              <p className="no-data">Need more conversations to identify patterns</p>
            )}
          </div>
        </div>
        
        {/* Recommendations */}
        <div className="insight-card recommendations-card">
          <h3>Personalized Recommendations</h3>
          <p className="card-summary">{insights.recommendations.summary}</p>
          <div className="recommendations-list">
            {insights.recommendations.recommendations && insights.recommendations.recommendations.length > 0 ? (
              insights.recommendations.recommendations.map((rec, index) => (
                <div key={index} className="recommendation-item">
                  <div className="rec-header">
                    <span className="rec-title">{rec.title}</span>
                    <span className={`rec-category ${rec.category}`}>{rec.category}</span>
                  </div>
                  <p className="rec-description">{rec.description}</p>
                </div>
              ))
            ) : (
              <p className="no-data">Chat more to get personalized recommendations</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
