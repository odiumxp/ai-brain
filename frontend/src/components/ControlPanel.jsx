import { useState, useEffect } from 'react';
import '../styles/ControlPanel.css';

export default function ControlPanel() {
    const [systemStatus, setSystemStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [performanceData, setPerformanceData] = useState(null);
    const [logs, setLogs] = useState([]);
    const [memoryAnalysis, setMemoryAnalysis] = useState(null);
    const [personalityData, setPersonalityData] = useState(null);
    const [aiModels, setAiModels] = useState(null);
    const [securitySettings, setSecuritySettings] = useState(null);
    const [showPersonalityCustomize, setShowPersonalityCustomize] = useState(false);
    const [customizingTraits, setCustomizingTraits] = useState({});
    const [identityData, setIdentityData] = useState(null);

    const API_URL = 'http://localhost:3000';
    const USER_ID = 'f9364170-b5d7-4239-affd-1eea6ad5dac2';

    useEffect(() => {
        fetchSystemStatus();
        fetchPerformanceData();
        fetchLogs();
        fetchMemoryAnalysis();
        fetchPersonalityData();
        fetchAiModels();
        fetchSecuritySettings();
        fetchIdentityData();
    }, []);

    const fetchSystemStatus = async () => {
        setLoading(true);
        try {
            const [healthRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/health`),
                fetch(`${API_URL}/api/insights/${USER_ID}/stats`)
            ]);

            const health = await healthRes.json();
            const stats = await statsRes.json();

            setSystemStatus({
                health,
                stats,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error fetching system status:', error);
            setSystemStatus({
                error: 'Failed to fetch system status',
                timestamp: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchPerformanceData = async () => {
        try {
            const response = await fetch(`${API_URL}/api/control/performance`);
            const data = await response.json();
            setPerformanceData(data);
        } catch (error) {
            console.error('Error fetching performance data:', error);
        }
    };

    const fetchLogs = async () => {
        try {
            const response = await fetch(`${API_URL}/api/control/logs?limit=50`);
            const data = await response.json();
            setLogs(data.logs || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    };

    const fetchMemoryAnalysis = async () => {
        try {
            const response = await fetch(`${API_URL}/api/control/memory/analysis`);
            const data = await response.json();
            setMemoryAnalysis(data);
        } catch (error) {
            console.error('Error fetching memory analysis:', error);
        }
    };

    const fetchPersonalityData = async () => {
        try {
            const response = await fetch(`${API_URL}/api/control/personality`);
            const data = await response.json();
            setPersonalityData(data);
        } catch (error) {
            console.error('Error fetching personality data:', error);
        }
    };

    const fetchAiModels = async () => {
        try {
            const response = await fetch(`${API_URL}/api/control/models`);
            const data = await response.json();
            setAiModels(data);
        } catch (error) {
            console.error('Error fetching AI models:', error);
        }
    };

    const fetchSecuritySettings = async () => {
        try {
            const response = await fetch(`${API_URL}/api/control/security`);
            const data = await response.json();
            setSecuritySettings(data);
        } catch (error) {
            console.error('Error fetching security settings:', error);
        }
    };

    const fetchIdentityData = async () => {
        try {
            const response = await fetch(`${API_URL}/api/control/identity`);
            const data = await response.json();
            setIdentityData(data);
        } catch (error) {
            console.error('Error fetching identity data:', error);
        }
    };

    const getStatusColor = (status) => {
        if (status === 'healthy' || status === 'ok') return '#10b981';
        if (status === 'warning') return '#f59e0b';
        return '#ef4444';
    };

    const getStatusIcon = (status) => {
        if (status === 'healthy' || status === 'ok') return '✅';
        if (status === 'warning') return '⚠️';
        return '❌';
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatUptime = (seconds) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    const executeAction = async (action, params = {}) => {
        // Special handling for personality customization
        if (action === 'personality/customize') {
            if (personalityData?.traits) {
                const traitValues = {};
                personalityData.traits.forEach(trait => {
                    traitValues[trait.name] = trait.value;
                });
                setCustomizingTraits(traitValues);
                setShowPersonalityCustomize(true);
            }
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/control/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            const result = await response.json();
            alert(result.message || 'Action completed successfully');
            // Refresh relevant data
            fetchSystemStatus();
            if (action.includes('memory')) fetchMemoryAnalysis();
            if (action.includes('cache')) fetchPerformanceData();
        } catch (error) {
            alert(`Action failed: ${error.message}`);
        }
    };

    const savePersonalityTraits = async () => {
        try {
            const response = await fetch(`${API_URL}/api/control/personality`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ traits: customizingTraits })
            });
            const result = await response.json();
            if (response.ok) {
                alert('Personality traits updated successfully!');
                setShowPersonalityCustomize(false);
                fetchPersonalityData(); // Refresh the personality data
            } else {
                alert(`Failed to update personality: ${result.error}`);
            }
        } catch (error) {
            alert(`Failed to update personality: ${error.message}`);
        }
    };

    const closePersonalityCustomize = () => {
        setShowPersonalityCustomize(false);
        setCustomizingTraits({});
    };

    const updateTraitValue = (traitName, value) => {
        setCustomizingTraits(prev => ({
            ...prev,
            [traitName]: parseFloat(value)
        }));
    };

    if (loading) {
        return (
            <div className="control-panel">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading system status...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="control-panel">
            <div className="control-header">
                <h1>🛠️ Control Panel</h1>
                <button
                    className="refresh-btn"
                    onClick={fetchSystemStatus}
                    disabled={loading}
                >
                    🔄 Refresh
                </button>
            </div>

            <div className="control-tabs">
                <div className="tab-row">
                    <button
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        📊 Overview
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('performance')}
                    >
                        📈 Performance
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
                        onClick={() => setActiveTab('system')}
                    >
                        ⚙️ System
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'ai-models' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ai-models')}
                    >
                        🤖 AI Models
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'memory' ? 'active' : ''}`}
                        onClick={() => setActiveTab('memory')}
                    >
                        🧠 Memory
                    </button>
                </div>
                <div className="tab-row">
                    <button
                        className={`tab-btn ${activeTab === 'personality' ? 'active' : ''}`}
                        onClick={() => setActiveTab('personality')}
                    >
                        👤 Personality
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'identity' ? 'active' : ''}`}
                        onClick={() => setActiveTab('identity')}
                    >
                        🧠 Identity
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
                        onClick={() => setActiveTab('data')}
                    >
                        💾 Data
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        🔒 Security
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('logs')}
                    >
                        📋 Logs
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'backup' ? 'active' : ''}`}
                        onClick={() => setActiveTab('backup')}
                    >
                        💽 Backup
                    </button>
                </div>
                <div className="tab-row">
                    <button
                        className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
                        onClick={() => setActiveTab('config')}
                    >
                        🔧 Config
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'debug' ? 'active' : ''}`}
                        onClick={() => setActiveTab('debug')}
                    >
                        🐛 Debug
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('maintenance')}
                    >
                        🔧 Maintenance
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        📊 Analytics
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'network' ? 'active' : ''}`}
                        onClick={() => setActiveTab('network')}
                    >
                        🌐 Network
                    </button>
                </div>
            </div>

            <div className="control-content">
                {activeTab === 'overview' && (
                    <div className="overview-section">
                        <div className="status-cards">
                            <div className="status-card">
                                <h3>System Health</h3>
                                <div className="status-indicator">
                                    <span
                                        className="status-dot"
                                        style={{ backgroundColor: getStatusColor(systemStatus?.health?.status) }}
                                    ></span>
                                    <span className="status-text">
                                        {getStatusIcon(systemStatus?.health?.status)} {systemStatus?.health?.status || 'Unknown'}
                                    </span>
                                </div>
                            </div>

                            <div className="status-card">
                                <h3>Database</h3>
                                <div className="status-indicator">
                                    <span className="status-dot" style={{ backgroundColor: '#10b981' }}></span>
                                    <span className="status-text">✅ Connected</span>
                                </div>
                            </div>

                            <div className="status-card">
                                <h3>API Services</h3>
                                <div className="status-indicator">
                                    <span className="status-dot" style={{ backgroundColor: '#10b981' }}></span>
                                    <span className="status-text">✅ Online</span>
                                </div>
                            </div>
                        </div>

                        <div className="metrics-grid">
                            <div className="metric-card">
                                <h4>Total Conversations</h4>
                                <div className="metric-value">{systemStatus?.stats?.total_conversations || 0}</div>
                            </div>

                            <div className="metric-card">
                                <h4>Last 7 Days</h4>
                                <div className="metric-value">{systemStatus?.stats?.last_week || 0}</div>
                            </div>

                            <div className="metric-card">
                                <h4>Last 30 Days</h4>
                                <div className="metric-value">{systemStatus?.stats?.last_month || 0}</div>
                            </div>

                            <div className="metric-card">
                                <h4>Avg Importance</h4>
                                <div className="metric-value">
                                    {systemStatus?.stats?.avg_importance ? parseFloat(systemStatus.stats.avg_importance).toFixed(1) : '0.0'}
                                </div>
                            </div>
                        </div>

                        <div className="recent-activity">
                            <h3>Recent Activity</h3>
                            <div className="activity-item">
                                <span className="activity-time">Just now</span>
                                <span className="activity-desc">System status checked</span>
                            </div>
                            <div className="activity-item">
                                <span className="activity-time">{systemStatus?.timestamp ? new Date(systemStatus.timestamp).toLocaleTimeString() : 'Unknown'}</span>
                                <span className="activity-desc">Insights data refreshed</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'performance' && (
                    <div className="performance-section">
                        <div className="performance-metrics">
                            <h3>Performance Metrics</h3>
                            <div className="metrics-grid">
                                <div className="metric-card">
                                    <h4>Response Time</h4>
                                    <div className="metric-value">{performanceData?.avgResponseTime || '0'}ms</div>
                                    <div className="metric-trend">↓ 5% from last hour</div>
                                </div>
                                <div className="metric-card">
                                    <h4>Memory Usage</h4>
                                    <div className="metric-value">{formatBytes(performanceData?.memoryUsage || 0)}</div>
                                    <div className="metric-trend">→ Stable</div>
                                </div>
                                <div className="metric-card">
                                    <h4>CPU Usage</h4>
                                    <div className="metric-value">{performanceData?.cpuUsage || '0'}%</div>
                                    <div className="metric-trend">↑ 2% from last hour</div>
                                </div>
                                <div className="metric-card">
                                    <h4>Active Connections</h4>
                                    <div className="metric-value">{performanceData?.activeConnections || 0}</div>
                                    <div className="metric-trend">→ Stable</div>
                                </div>
                            </div>
                        </div>

                        <div className="performance-charts">
                            <h3>Performance Charts</h3>
                            <div className="chart-placeholder">
                                <p>📊 Real-time performance charts would be displayed here</p>
                                <p>Response time, memory usage, and throughput over time</p>
                            </div>
                        </div>

                        <div className="performance-actions">
                            <h3>Performance Actions</h3>
                            <div className="action-buttons">
                                <button className="action-btn primary" onClick={() => executeAction('performance/optimize')}>⚡ Optimize Performance</button>
                                <button className="action-btn secondary" onClick={() => executeAction('performance/gc')}>🗑️ Force Garbage Collection</button>
                                <button className="action-btn secondary" onClick={() => executeAction('performance/profile')}>📊 Start Profiling</button>
                                <button className="action-btn warning" onClick={() => executeAction('performance/reset-metrics')}>🔄 Reset Metrics</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ai-models' && (
                    <div className="ai-models-section">
                        <div className="models-status">
                            <h3>AI Models Status</h3>
                            <div className="model-cards">
                                {aiModels && aiModels.map((model, index) => (
                                    <div key={index} className="model-card">
                                        <h4>{model.name}</h4>
                                        <div className="model-status">
                                            <span className="status-dot" style={{ backgroundColor: model.status === 'active' ? '#10b981' : '#6b7280' }}></span>
                                            <span>{model.status === 'active' ? 'Active' : 'Available'}</span>
                                        </div>
                                        <div className="model-stats">
                                            <p>Requests: {model.requests || 0}</p>
                                            <p>Success Rate: {model.successRate || '0'}%</p>
                                            <p>Avg Response: {model.avgResponseTime || '0'}ms</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="model-controls">
                            <h3>Model Controls</h3>
                            <div className="control-group">
                                <label>Primary Model:</label>
                                <select defaultValue="gpt-4">
                                    <option value="gpt-4">GPT-4</option>
                                    <option value="claude">Claude</option>
                                    <option value="auto">Auto (Load Balance)</option>
                                </select>
                            </div>
                            <div className="control-group">
                                <label>Fallback Model:</label>
                                <select defaultValue="claude">
                                    <option value="gpt-4">GPT-4</option>
                                    <option value="claude">Claude</option>
                                    <option value="none">None</option>
                                </select>
                            </div>
                        </div>

                        <div className="model-actions">
                            <h3>Model Actions</h3>
                            <div className="action-buttons">
                                <button className="action-btn primary" onClick={() => executeAction('models/test')}>🧪 Test Models</button>
                                <button className="action-btn secondary" onClick={() => executeAction('models/switch', { model: 'gpt-4' })}>🔄 Switch to GPT-4</button>
                                <button className="action-btn secondary" onClick={() => executeAction('models/switch', { model: 'claude' })}>🔄 Switch to Claude</button>
                                <button className="action-btn warning" onClick={() => executeAction('models/reset-stats')}>📊 Reset Statistics</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'memory' && (
                    <div className="memory-section">
                        <div className="memory-overview">
                            <h3>Memory Analysis</h3>
                            <div className="memory-stats">
                                <div className="memory-stat">
                                    <h4>Episodic Memory</h4>
                                    <p>{memoryAnalysis?.episodic?.count || 0} memories</p>
                                    <p>{formatBytes(memoryAnalysis?.episodic?.size || 0)} stored</p>
                                </div>
                                <div className="memory-stat">
                                    <h4>Working Memory</h4>
                                    <p>{memoryAnalysis?.working?.activeSessions || 0} active sessions</p>
                                    <p>{formatBytes(memoryAnalysis?.working?.size || 0)} in use</p>
                                </div>
                                <div className="memory-stat">
                                    <h4>Cache</h4>
                                    <p>{memoryAnalysis?.cache?.entries || 0} cached items</p>
                                    <p>{formatBytes(memoryAnalysis?.cache?.size || 0)} cached</p>
                                </div>
                            </div>
                        </div>

                        <div className="memory-operations">
                            <h3>Memory Operations</h3>
                            <div className="action-buttons">
                                <button className="action-btn primary" onClick={() => executeAction('memory/consolidate')}>🔄 Consolidate Memories</button>
                                <button className="action-btn secondary" onClick={() => executeAction('memory/cleanup')}>🧹 Clean Old Memories</button>
                                <button className="action-btn secondary" onClick={() => executeAction('memory/optimize')}>⚡ Optimize Memory</button>
                                <button className="action-btn warning" onClick={() => executeAction('memory/clear-cache')}>🗑️ Clear Cache</button>
                                <button className="action-btn danger" onClick={() => executeAction('memory/reset')}>💥 Reset Memory</button>
                            </div>
                        </div>

                        <div className="memory-settings">
                            <h3>Memory Settings</h3>
                            <div className="setting-group">
                                <div className="setting-item">
                                    <label>Memory Retention:</label>
                                    <select defaultValue="90">
                                        <option value="30">30 days</option>
                                        <option value="90">90 days</option>
                                        <option value="365">1 year</option>
                                        <option value="unlimited">Unlimited</option>
                                    </select>
                                </div>
                                <div className="setting-item">
                                    <label>Importance Threshold:</label>
                                    <input type="range" min="0" max="1" step="0.1" defaultValue="0.3" />
                                    <span>0.3</span>
                                </div>
                                <div className="setting-item">
                                    <label>Auto Consolidation:</label>
                                    <input type="checkbox" defaultChecked />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'personality' && (
                    <div className="personality-section">
                        <div className="personality-traits">
                            <h3>Personality Traits</h3>
                            <div className="traits-grid">
                                {(personalityData?.traits || []).map((trait, index) => (
                                    <div key={index} className="trait-card">
                                        <h4>{trait.name}</h4>
                                        <div className="trait-bar">
                                            <div
                                                className="trait-fill"
                                                style={{ width: `${trait.value * 10}%` }}
                                            ></div>
                                        </div>
                                        <span className="trait-value">{trait.value}/10</span>
                                        <p className="trait-desc">{trait.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="personality-evolution">
                            <h3>Evolution Controls</h3>
                            <div className="evolution-stats">
                                <p>Last Evolution: {personalityData?.lastEvolution || 'Never'}</p>
                                <p>Changes This Week: {personalityData?.weeklyChanges || 0}</p>
                                <p>Adaptation Rate: {personalityData?.adaptationRate || '0'}/day</p>
                            </div>
                            <div className="action-buttons">
                                <button className="action-btn primary" onClick={() => executeAction('personality/evolve')}>🧬 Force Evolution</button>
                                <button className="action-btn secondary" onClick={() => executeAction('personality/reset')}>🔄 Reset to Default</button>
                                <button className="action-btn warning" onClick={() => executeAction('personality/customize')}>🎨 Customize Personality</button>
                            </div>
                        </div>

                        <div className="personality-personas">
                            <h3>AI Personas</h3>
                            <div className="personas-list">
                                {(personalityData?.personas || []).map((persona, index) => (
                                    <div key={index} className="persona-item">
                                        <span className="persona-emoji">{persona.emoji}</span>
                                        <span className="persona-name">{persona.name}</span>
                                        <span className="persona-status">{persona.active ? 'Active' : 'Inactive'}</span>
                                        <button className="persona-toggle" onClick={() => executeAction('personality/toggle-persona', { id: persona.id })}>
                                            {persona.active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'identity' && (
                    <div className="identity-section">
                        <div className="identity-header">
                            <h3>🧠 Self-Model Layer</h3>
                            <p>Identity summaries and self-awareness tracking</p>
                        </div>

                        <div className="identity-summaries">
                            <h4>Identity Summaries</h4>
                            {identityData?.summaries?.length > 0 ? (
                                <div className="identity-cards">
                                    {identityData.summaries.map((summary, index) => (
                                        <div key={index} className="identity-card">
                                            <div className="identity-card-header">
                                                <span className="identity-emoji">{summary.emoji}</span>
                                                <h5>{summary.personaName}</h5>
                                                <div className="identity-metrics">
                                                    <span className="stability">Stability: {(summary.stability * 100).toFixed(1)}%</span>
                                                    <span className="confidence">Confidence: {(summary.confidence * 100).toFixed(1)}%</span>
                                                </div>
                                            </div>

                                            <div className="identity-content">
                                                <div className="identity-section">
                                                    <h6>Personality Summary</h6>
                                                    <p>{summary.personality || 'No personality summary available'}</p>
                                                </div>

                                                <div className="identity-section">
                                                    <h6>Behavioral Patterns</h6>
                                                    <p>{summary.behavior || 'No behavioral data available'}</p>
                                                </div>

                                                <div className="identity-section">
                                                    <h6>Relationship Dynamics</h6>
                                                    <p>{summary.relationships || 'No relationship data available'}</p>
                                                </div>

                                                <div className="identity-section">
                                                    <h6>Evolution Trends</h6>
                                                    <p>{summary.evolution || 'No evolution data available'}</p>
                                                </div>
                                            </div>

                                            <div className="identity-footer">
                                                <small>Generated: {new Date(summary.generatedAt).toLocaleString()}</small>
                                                {summary.isActive && <span className="active-badge">Active</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-data">
                                    <p>🧠 No identity summaries available yet. Identity summaries are generated daily at 5 AM.</p>
                                    <button
                                        className="generate-identity-btn"
                                        onClick={async () => {
                                            try {
                                                const response = await fetch(`${API_URL}/api/control/identity/generate`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ userId: USER_ID })
                                                });
                                                if (response.ok) {
                                                    alert('Identity summary generation started. Refresh the page in a few moments.');
                                                } else {
                                                    alert('Failed to start identity generation.');
                                                }
                                            } catch (error) {
                                                console.error('Error generating identity:', error);
                                                alert('Error generating identity summary.');
                                            }
                                        }}
                                    >
                                        Generate Identity Summary
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="identity-info">
                            <h4>About Self-Model Layer</h4>
                            <div className="info-grid">
                                <div className="info-item">
                                    <h5>📊 Stability Score</h5>
                                    <p>Measures how consistent your AI's personality and behavior patterns are over time.</p>
                                </div>
                                <div className="info-item">
                                    <h5>🎯 Confidence Level</h5>
                                    <p>Indicates how reliable the identity analysis is based on available data.</p>
                                </div>
                                <div className="info-item">
                                    <h5>🔄 Daily Updates</h5>
                                    <p>Identity summaries are automatically generated every day at 5 AM.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="security-section">
                        <div className="security-status">
                            <h3>Security Overview</h3>
                            <div className="security-metrics">
                                <div className="security-metric">
                                    <h4>API Keys</h4>
                                    <p>{securitySettings?.apiKeys?.count || 0} configured</p>
                                    <p>{securitySettings?.apiKeys?.valid || 0} valid</p>
                                </div>
                                <div className="security-metric">
                                    <h4>Access Control</h4>
                                    <p>{securitySettings?.access?.rules || 0} rules</p>
                                    <p>{securitySettings?.access?.active || 0} active</p>
                                </div>
                                <div className="security-metric">
                                    <h4>Security Events</h4>
                                    <p>{securitySettings?.events?.today || 0} today</p>
                                    <p>{securitySettings?.events?.warnings || 0} warnings</p>
                                </div>
                            </div>
                        </div>

                        <div className="security-keys">
                            <h3>API Key Management</h3>
                            <div className="api-keys-list">
                                {(securitySettings?.apiKeys?.list || []).map((key, index) => (
                                    <div key={index} className="api-key-item">
                                        <span className="key-name">{key.name}</span>
                                        <span className="key-status">{key.valid ? 'Valid' : 'Invalid'}</span>
                                        <span className="key-last-used">{key.lastUsed}</span>
                                        <button className="key-rotate" onClick={() => executeAction('security/rotate-key', { id: key.id })}>
                                            🔄 Rotate
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button className="action-btn primary" onClick={() => executeAction('security/add-key')}>
                                ➕ Add API Key
                            </button>
                        </div>

                        <div className="security-actions">
                            <h3>Security Actions</h3>
                            <div className="action-buttons">
                                <button className="action-btn primary" onClick={() => executeAction('security/audit')}>🔍 Run Security Audit</button>
                                <button className="action-btn secondary" onClick={() => executeAction('security/rotate-all')}>🔄 Rotate All Keys</button>
                                <button className="action-btn warning" onClick={() => executeAction('security/lockdown')}>🔒 Emergency Lockdown</button>
                                <button className="action-btn danger" onClick={() => executeAction('security/reset')}>💥 Reset Security</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="logs-section">
                        <div className="logs-controls">
                            <h3>System Logs</h3>
                            <div className="log-filters">
                                <select defaultValue="all">
                                    <option value="all">All Logs</option>
                                    <option value="error">Errors</option>
                                    <option value="warning">Warnings</option>
                                    <option value="info">Info</option>
                                    <option value="debug">Debug</option>
                                </select>
                                <input type="text" placeholder="Search logs..." />
                                <button className="action-btn secondary" onClick={fetchLogs}>🔄 Refresh</button>
                            </div>
                        </div>

                        <div className="logs-display">
                            <div className="logs-container">
                                {logs.map((log, index) => (
                                    <div key={index} className={`log-entry log-${log.level}`}>
                                        <span className="log-time">{new Date(log.timestamp).toLocaleString()}</span>
                                        <span className="log-level">[{log.level.toUpperCase()}]</span>
                                        <span className="log-message">{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="logs-actions">
                            <div className="action-buttons">
                                <button className="action-btn secondary" onClick={() => executeAction('logs/export')}>💾 Export Logs</button>
                                <button className="action-btn warning" onClick={() => executeAction('logs/clear')}>🗑️ Clear Logs</button>
                                <button className="action-btn secondary" onClick={() => executeAction('logs/archive')}>📦 Archive Logs</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'backup' && (
                    <div className="backup-section">
                        <div className="backup-status">
                            <h3>Backup & Restore</h3>
                            <div className="backup-info">
                                <div className="backup-stat">
                                    <h4>Last Backup</h4>
                                    <p>{systemStatus?.backup?.lastBackup || 'Never'}</p>
                                </div>
                                <div className="backup-stat">
                                    <h4>Backup Size</h4>
                                    <p>{formatBytes(systemStatus?.backup?.size || 0)}</p>
                                </div>
                                <div className="backup-stat">
                                    <h4>Available Backups</h4>
                                    <p>{systemStatus?.backup?.count || 0} backups</p>
                                </div>
                            </div>
                        </div>

                        <div className="backup-operations">
                            <h3>Backup Operations</h3>
                            <div className="action-buttons">
                                <button className="action-btn primary" onClick={() => executeAction('backup/create')}>💾 Create Backup</button>
                                <button className="action-btn secondary" onClick={() => executeAction('backup/list')}>📋 List Backups</button>
                                <button className="action-btn secondary" onClick={() => executeAction('backup/verify')}>✅ Verify Backup</button>
                                <button className="action-btn warning" onClick={() => executeAction('backup/cleanup')}>🧹 Cleanup Old Backups</button>
                            </div>
                        </div>

                        <div className="restore-operations">
                            <h3>Restore Operations</h3>
                            <div className="restore-warning">
                                ⚠️ Restoring will overwrite current data. Make sure you have a backup!
                            </div>
                            <div className="action-buttons">
                                <button className="action-btn warning" onClick={() => executeAction('backup/restore', { type: 'full' })}>
                                    🔄 Full Restore
                                </button>
                                <button className="action-btn secondary" onClick={() => executeAction('backup/restore', { type: 'memory' })}>
                                    🧠 Restore Memory Only
                                </button>
                                <button className="action-btn secondary" onClick={() => executeAction('backup/restore', { type: 'personality' })}>
                                    👤 Restore Personality Only
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'debug' && (
                    <div className="debug-section">
                        <div className="debug-tools">
                            <h3>Debug Tools</h3>
                            <div className="debug-grid">
                                <div className="debug-tool">
                                    <h4>API Tester</h4>
                                    <p>Test API endpoints and responses</p>
                                    <button className="action-btn secondary" onClick={() => executeAction('debug/test-api')}>
                                        🧪 Test API
                                    </button>
                                </div>
                                <div className="debug-tool">
                                    <h4>Memory Debugger</h4>
                                    <p>Inspect memory usage and leaks</p>
                                    <button className="action-btn secondary" onClick={() => executeAction('debug/memory-inspect')}>
                                        🔍 Inspect Memory
                                    </button>
                                </div>
                                <div className="debug-tool">
                                    <h4>Performance Profiler</h4>
                                    <p>Profile system performance</p>
                                    <button className="action-btn secondary" onClick={() => executeAction('debug/profile')}>
                                        📊 Profile
                                    </button>
                                </div>
                                <div className="debug-tool">
                                    <h4>Database Inspector</h4>
                                    <p>Inspect database tables and data</p>
                                    <button className="action-btn secondary" onClick={() => executeAction('debug/db-inspect')}>
                                        🗄️ Inspect DB
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="debug-console">
                            <h3>Debug Console</h3>
                            <div className="console-output">
                                <pre>Debug output will appear here...</pre>
                            </div>
                            <div className="console-input">
                                <input type="text" placeholder="Enter debug command..." />
                                <button className="action-btn primary">Execute</button>
                            </div>
                        </div>

                        <div className="debug-actions">
                            <h3>Debug Actions</h3>
                            <div className="action-buttons">
                                <button className="action-btn warning" onClick={() => executeAction('debug/enable-verbose')}>
                                    📢 Enable Verbose Logging
                                </button>
                                <button className="action-btn secondary" onClick={() => executeAction('debug/reset')}>🔄 Reset Debug State</button>
                                <button className="action-btn danger" onClick={() => executeAction('debug/clear-all')}>💥 Clear All Debug Data</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'maintenance' && (
                    <div className="maintenance-section">
                        <div className="maintenance-schedule">
                            <h3>Maintenance Schedule</h3>
                            <div className="maintenance-tasks">
                                <div className="maintenance-task">
                                    <h4>Daily Cleanup</h4>
                                    <p>Remove old sessions and temporary data</p>
                                    <p>Next run: {systemStatus?.maintenance?.dailyCleanup || '2:00 AM'}</p>
                                    <button className="action-btn secondary" onClick={() => executeAction('maintenance/run-daily')}>
                                        ▶️ Run Now
                                    </button>
                                </div>
                                <div className="maintenance-task">
                                    <h4>Weekly Optimization</h4>
                                    <p>Optimize database and memory structures</p>
                                    <p>Next run: {systemStatus?.maintenance?.weeklyOptimization || 'Sunday 3:00 AM'}</p>
                                    <button className="action-btn secondary" onClick={() => executeAction('maintenance/run-weekly')}>
                                        ▶️ Run Now
                                    </button>
                                </div>
                                <div className="maintenance-task">
                                    <h4>Monthly Archive</h4>
                                    <p>Archive old data and create backups</p>
                                    <p>Next run: {systemStatus?.maintenance?.monthlyArchive || '1st of month'}</p>
                                    <button className="action-btn secondary" onClick={() => executeAction('maintenance/run-monthly')}>
                                        ▶️ Run Now
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="maintenance-tools">
                            <h3>Maintenance Tools</h3>
                            <div className="action-buttons">
                                <button className="action-btn primary" onClick={() => executeAction('maintenance/full-checkup')}>
                                    🔍 Full System Checkup
                                </button>
                                <button className="action-btn secondary" onClick={() => executeAction('maintenance/defragment')}>
                                    🧩 Defragment Database
                                </button>
                                <button className="action-btn secondary" onClick={() => executeAction('maintenance/repair')}>
                                    🔧 Repair Corrupted Data
                                </button>
                                <button className="action-btn warning" onClick={() => executeAction('maintenance/vacuum')}>
                                    💨 Vacuum Database
                                </button>
                                <button className="action-btn danger" onClick={() => executeAction('maintenance/emergency-repair')}>
                                    🚨 Emergency Repair
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="analytics-section">
                        <div className="analytics-overview">
                            <h3>Analytics Dashboard</h3>
                            <div className="analytics-metrics">
                                <div className="analytics-metric">
                                    <h4>User Engagement</h4>
                                    <div className="metric-large">{systemStatus?.analytics?.engagement || '85'}%</div>
                                    <p>↑ 5% from last week</p>
                                </div>
                                <div className="analytics-metric">
                                    <h4>Response Quality</h4>
                                    <div className="metric-large">{systemStatus?.analytics?.quality || '4.2'}/5</div>
                                    <p>→ Stable</p>
                                </div>
                                <div className="analytics-metric">
                                    <h4>Learning Rate</h4>
                                    <div className="metric-large">{systemStatus?.analytics?.learning || '12'}%</div>
                                    <p>↑ 2% from last month</p>
                                </div>
                            </div>
                        </div>

                        <div className="analytics-charts">
                            <h3>Analytics Charts</h3>
                            <div className="chart-placeholder">
                                <p>📊 Advanced analytics charts would be displayed here</p>
                                <p>Usage patterns, learning curves, and performance trends</p>
                            </div>
                        </div>

                        <div className="analytics-reports">
                            <h3>Reports</h3>
                            <div className="action-buttons">
                                <button className="action-btn primary" onClick={() => executeAction('analytics/generate-report')}>
                                    📄 Generate Report
                                </button>
                                <button className="action-btn secondary" onClick={() => executeAction('analytics/export-data')}>
                                    💾 Export Analytics Data
                                </button>
                                <button className="action-btn secondary" onClick={() => executeAction('analytics/schedule-report')}>
                                    📅 Schedule Reports
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'network' && (
                    <div className="network-section">
                        <div className="network-status">
                            <h3>Network Status</h3>
                            <div className="network-metrics">
                                <div className="network-metric">
                                    <h4>Connection Status</h4>
                                    <div className="status-indicator">
                                        <span className="status-dot" style={{ backgroundColor: '#10b981' }}></span>
                                        <span>Online</span>
                                    </div>
                                </div>
                                <div className="network-metric">
                                    <h4>Latency</h4>
                                    <p>{performanceData?.latency || '45'}ms</p>
                                </div>
                                <div className="network-metric">
                                    <h4>Data Transfer</h4>
                                    <p>{formatBytes(performanceData?.dataTransfer || 0)}/hour</p>
                                </div>
                                <div className="network-metric">
                                    <h4>API Calls</h4>
                                    <p>{performanceData?.apiCalls || 0}/hour</p>
                                </div>
                            </div>
                        </div>

                        <div className="network-endpoints">
                            <h3>API Endpoints</h3>
                            <div className="endpoints-list">
                                <div className="endpoint-item">
                                    <span className="endpoint-method">GET</span>
                                    <span className="endpoint-path">/health</span>
                                    <span className="endpoint-status">✅ 200</span>
                                </div>
                                <div className="endpoint-item">
                                    <span className="endpoint-method">POST</span>
                                    <span className="endpoint-path">/api/chat</span>
                                    <span className="endpoint-status">✅ 200</span>
                                </div>
                                <div className="endpoint-item">
                                    <span className="endpoint-method">GET</span>
                                    <span className="endpoint-path">/api/insights</span>
                                    <span className="endpoint-status">✅ 200</span>
                                </div>
                                <div className="endpoint-item">
                                    <span className="endpoint-method">GET</span>
                                    <span className="endpoint-path">/api/personas</span>
                                    <span className="endpoint-status">✅ 200</span>
                                </div>
                            </div>
                        </div>

                        <div className="network-actions">
                            <h3>Network Actions</h3>
                            <div className="action-buttons">
                                <button className="action-btn primary" onClick={() => executeAction('network/test-connectivity')}>
                                    🌐 Test Connectivity
                                </button>
                                <button className="action-btn secondary" onClick={() => executeAction('network/ping')}>📡 Ping Services</button>
                                <button className="action-btn secondary" onClick={() => executeAction('network/reset-connections')}>🔄 Reset Connections</button>
                                <button className="action-btn warning" onClick={() => executeAction('network/firewall-check')}>🔥 Firewall Check</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && (
                    <div className="system-section">
                        <div className="system-info">
                            <h3>System Information</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Server Status:</label>
                                    <span className="info-value">{systemStatus?.health?.status || 'Unknown'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Database:</label>
                                    <span className="info-value">PostgreSQL (Connected)</span>
                                </div>
                                <div className="info-item">
                                    <label>AI Models:</label>
                                    <span className="info-value">GPT-4, Claude (Active)</span>
                                </div>
                                <div className="info-item">
                                    <label>Memory System:</label>
                                    <span className="info-value">Episodic Memory (Active)</span>
                                </div>
                                <div className="info-item">
                                    <label>Cron Jobs:</label>
                                    <span className="info-value">Consolidation, Evolution, Cleanup (Running)</span>
                                </div>
                                <div className="info-item">
                                    <label>Cache Status:</label>
                                    <span className="info-value">10-minute TTL (Active)</span>
                                </div>
                            </div>
                        </div>

                        <div className="system-actions">
                            <h3>System Actions</h3>
                            <div className="action-buttons">
                                <button className="action-btn secondary">🔄 Restart Services</button>
                                <button className="action-btn secondary">🧹 Clear Cache</button>
                                <button className="action-btn warning">📊 Run Diagnostics</button>
                                <button className="action-btn danger">🛑 Emergency Stop</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'data' && (
                    <div className="data-section">
                        <div className="data-overview">
                            <h3>Data Management</h3>
                            <div className="data-stats">
                                <div className="data-stat">
                                    <h4>Episodic Memories</h4>
                                    <p>{systemStatus?.stats?.total_conversations || 0} records</p>
                                </div>
                                <div className="data-stat">
                                    <h4>Working Memory</h4>
                                    <p>Active sessions managed</p>
                                </div>
                                <div className="data-stat">
                                    <h4>Personality Traits</h4>
                                    <p>7 traits evolving</p>
                                </div>
                            </div>
                        </div>

                        <div className="data-actions">
                            <h3>Data Operations</h3>
                            <div className="action-buttons">
                                <button className="action-btn secondary">💾 Export Data</button>
                                <button className="action-btn secondary">📥 Import Data</button>
                                <button className="action-btn warning">🧹 Clean Old Data</button>
                                <button
                                    className="action-btn danger"
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to reset the database? This will remove all data.')) {
                                            executeAction('data/reset-database');
                                        }
                                    }}
                                >
                                    🗑️ Reset Database
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'config' && (
                    <div className="config-section">
                        <div className="config-settings">
                            <h3>Configuration Settings</h3>
                            <div className="setting-group">
                                <h4>AI Settings</h4>
                                <div className="setting-item">
                                    <label>Primary AI Model:</label>
                                    <select defaultValue="gpt-4">
                                        <option value="gpt-4">GPT-4</option>
                                        <option value="claude">Claude</option>
                                        <option value="both">Both (Fallback)</option>
                                    </select>
                                </div>
                                <div className="setting-item">
                                    <label>Temperature:</label>
                                    <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" />
                                    <span>0.7</span>
                                </div>
                            </div>

                            <div className="setting-group">
                                <h4>Memory Settings</h4>
                                <div className="setting-item">
                                    <label>Working Memory TTL:</label>
                                    <select defaultValue="3600000">
                                        <option value="1800000">30 minutes</option>
                                        <option value="3600000">1 hour</option>
                                        <option value="7200000">2 hours</option>
                                    </select>
                                </div>
                                <div className="setting-item">
                                    <label>Insights Cache TTL:</label>
                                    <select defaultValue="600000">
                                        <option value="300000">5 minutes</option>
                                        <option value="600000">10 minutes</option>
                                        <option value="1800000">30 minutes</option>
                                    </select>
                                </div>
                            </div>

                            <div className="setting-group">
                                <h4>Cron Jobs</h4>
                                <div className="setting-item">
                                    <label>Memory Consolidation:</label>
                                    <input type="checkbox" defaultChecked />
                                    <span>Daily at 2 AM</span>
                                </div>
                                <div className="setting-item">
                                    <label>Personality Evolution:</label>
                                    <input type="checkbox" defaultChecked />
                                    <span>Daily at 3 AM</span>
                                </div>
                                <div className="setting-item">
                                    <label>Connection Decay:</label>
                                    <input type="checkbox" defaultChecked />
                                    <span>Weekly on Sunday</span>
                                </div>
                            </div>
                        </div>

                        <div className="config-actions">
                            <button className="action-btn primary">💾 Save Settings</button>
                            <button className="action-btn secondary">🔄 Reset to Defaults</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Personality Customization Modal */}
            {showPersonalityCustomize && (
                <div className="modal-overlay" onClick={closePersonalityCustomize}>
                    <div className="modal-content personality-customize-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🎨 Customize Personality Traits</h2>
                            <button className="modal-close" onClick={closePersonalityCustomize}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>Adjust the personality traits below. Values range from 0 (low) to 10 (high).</p>
                            <div className="personality-customize-grid">
                                {personalityData?.traits?.map((trait) => (
                                    <div key={trait.name} className="customize-trait-item">
                                        <label htmlFor={`trait-${trait.name}`}>
                                            <strong>{trait.name.charAt(0).toUpperCase() + trait.name.slice(1)}</strong>
                                        </label>
                                        <div className="trait-slider-container">
                                            <input
                                                type="range"
                                                id={`trait-${trait.name}`}
                                                min="0"
                                                max="10"
                                                step="0.1"
                                                value={customizingTraits[trait.name] || trait.value}
                                                onChange={(e) => updateTraitValue(trait.name, e.target.value)}
                                                className="trait-slider"
                                            />
                                            <span className="trait-value-display">
                                                {(customizingTraits[trait.name] || trait.value).toFixed(1)}
                                            </span>
                                        </div>
                                        <p className="trait-description">{trait.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="action-btn secondary" onClick={closePersonalityCustomize}>
                                Cancel
                            </button>
                            <button className="action-btn primary" onClick={savePersonalityTraits}>
                                💾 Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
