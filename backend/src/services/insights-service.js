// AI Insights Service - Analyzes conversation patterns and provides insights
const { query } = require('../db/connection');
const gptService = require('./gpt-service');

/**
 * Get conversation topics analysis
 */
async function getTopicsAnalysis(userId, days = 30) {
    try {
        const result = await query(`
            SELECT 
                conversation_text,
                timestamp
            FROM episodic_memory
            WHERE user_id = $1
            AND timestamp > NOW() - INTERVAL '${days} days'
            ORDER BY timestamp DESC
        `, [userId]);
        
        if (result.rows.length === 0) {
            return { topics: [], summary: 'Not enough conversation data yet.' };
        }
        
        // Extract all conversations
        const conversations = result.rows.map(row => {
            const conv = typeof row.conversation_text === 'string' 
                ? JSON.parse(row.conversation_text)
                : row.conversation_text;
            return conv.user;
        }).join('\n');
        
        // Ask GPT to analyze topics
        const prompt = `Analyze these conversation excerpts and identify the top 5 topics discussed most frequently. For each topic, provide a brief description and estimate how often it came up.

Conversations:
${conversations.substring(0, 3000)}

Respond ONLY with valid JSON in this format:
{
  "topics": [
    {"name": "Topic Name", "frequency": "high/medium/low", "description": "Brief description"},
    ...
  ],
  "summary": "One sentence overall summary"
}`;

        const response = await gptService.sendMessage('You are a data analyst.', prompt);
        
        // Parse JSON response
        const cleaned = response.replace(/```json|```/g, '').trim();
        const analysis = JSON.parse(cleaned);
        
        return analysis;
    } catch (error) {
        console.error('Topics analysis error:', error);
        return { topics: [], summary: 'Unable to analyze topics.' };
    }
}

/**
 * Get mood analysis
 */
async function getMoodAnalysis(userId, days = 30) {
    try {
        const result = await query(`
            SELECT 
                emotional_context,
                timestamp
            FROM episodic_memory
            WHERE user_id = $1
            AND timestamp > NOW() - INTERVAL '${days} days'
            AND emotional_context IS NOT NULL
            ORDER BY timestamp ASC
        `, [userId]);
        
        if (result.rows.length === 0) {
            return { 
                overall: 'neutral', 
                trend: 'stable',
                emotions: {},
                summary: 'Not enough emotional data yet.'
            };
        }
        
        // Aggregate emotions
        const emotionTotals = {
            joy: 0,
            sadness: 0,
            anger: 0,
            fear: 0,
            surprise: 0
        };
        
        result.rows.forEach(row => {
            const emotions = typeof row.emotional_context === 'string'
                ? JSON.parse(row.emotional_context)
                : row.emotional_context;
            
            Object.keys(emotionTotals).forEach(emotion => {
                if (emotions[emotion]) {
                    emotionTotals[emotion] += emotions[emotion];
                }
            });
        });
        
        // Calculate averages
        const count = result.rows.length;
        Object.keys(emotionTotals).forEach(emotion => {
            emotionTotals[emotion] = (emotionTotals[emotion] / count).toFixed(2);
        });
        
        // Determine overall mood
        const dominant = Object.entries(emotionTotals)
            .sort((a, b) => b[1] - a[1])[0];
        
        const overall = parseFloat(dominant[1]) > 0.3 ? dominant[0] : 'neutral';
        
        // Analyze trend (compare first half vs second half)
        const midpoint = Math.floor(result.rows.length / 2);
        const firstHalf = result.rows.slice(0, midpoint);
        const secondHalf = result.rows.slice(midpoint);
        
        const getAvgJoy = (rows) => {
            const total = rows.reduce((sum, row) => {
                const emotions = typeof row.emotional_context === 'string'
                    ? JSON.parse(row.emotional_context)
                    : row.emotional_context;
                return sum + (emotions.joy || 0);
            }, 0);
            return total / rows.length;
        };
        
        const firstJoy = getAvgJoy(firstHalf);
        const secondJoy = getAvgJoy(secondHalf);
        const diff = secondJoy - firstJoy;
        
        const trend = diff > 0.1 ? 'improving' : diff < -0.1 ? 'declining' : 'stable';
        
        return {
            overall,
            trend,
            emotions: emotionTotals,
            summary: `Your mood has been mostly ${overall} and ${trend} over the past ${days} days.`
        };
    } catch (error) {
        console.error('Mood analysis error:', error);
        return { 
            overall: 'neutral', 
            trend: 'stable',
            emotions: {},
            summary: 'Unable to analyze mood.'
        };
    }
}

/**
 * Get behavior patterns
 */
async function getBehaviorPatterns(userId) {
    try {
        const result = await query(`
            SELECT 
                conversation_text,
                timestamp,
                importance_score
            FROM episodic_memory
            WHERE user_id = $1
            ORDER BY timestamp DESC
            LIMIT 100
        `, [userId]);
        
        if (result.rows.length === 0) {
            return { patterns: [], summary: 'Not enough data to identify patterns.' };
        }
        
        // Extract conversations for analysis
        const conversations = result.rows.map(row => {
            const conv = typeof row.conversation_text === 'string'
                ? JSON.parse(row.conversation_text)
                : row.conversation_text;
            return `User: ${conv.user}\nAI: ${conv.ai}`;
        }).join('\n\n');
        
        // Ask GPT to identify patterns
        const prompt = `Analyze these conversations and identify 3-5 behavioral patterns or habits. Look for recurring themes, questions, concerns, or topics the user brings up repeatedly.

Conversations:
${conversations.substring(0, 4000)}

Respond ONLY with valid JSON in this format:
{
  "patterns": [
    {"pattern": "Pattern description", "frequency": "often/sometimes/rarely"},
    ...
  ],
  "summary": "One sentence overall summary"
}`;

        const response = await gptService.sendMessage('You are a behavioral analyst.', prompt);
        
        const cleaned = response.replace(/```json|```/g, '').trim();
        const analysis = JSON.parse(cleaned);
        
        return analysis;
    } catch (error) {
        console.error('Behavior patterns error:', error);
        return { patterns: [], summary: 'Unable to identify patterns.' };
    }
}

/**
 * Get personalized recommendations
 */
async function getRecommendations(userId) {
    try {
        // Get recent conversations and personality
        const [memoriesResult, personalityResult] = await Promise.all([
            query(`
                SELECT conversation_text
                FROM episodic_memory
                WHERE user_id = $1
                ORDER BY timestamp DESC
                LIMIT 50
            `, [userId]),
            query(`
                SELECT trait_name, current_value
                FROM personality_state
                WHERE user_id = $1
            `, [userId])
        ]);
        
        if (memoriesResult.rows.length === 0) {
            return { 
                recommendations: [], 
                summary: 'Chat more to get personalized recommendations!' 
            };
        }
        
        // Format data
        const conversations = memoriesResult.rows.map(row => {
            const conv = typeof row.conversation_text === 'string'
                ? JSON.parse(row.conversation_text)
                : row.conversation_text;
            return conv.user;
        }).join('\n');
        
        const traits = personalityResult.rows.map(row => 
            `${row.trait_name}: ${row.current_value}/10`
        ).join(', ');
        
        // Ask GPT for recommendations
        const prompt = `Based on these conversation topics and personality traits, provide 3-5 personalized recommendations for things this person might find interesting, helpful, or relevant.

Recent topics: ${conversations.substring(0, 2000)}

Personality: ${traits}

Respond ONLY with valid JSON in this format:
{
  "recommendations": [
    {"title": "Recommendation title", "description": "Why this would be helpful", "category": "learning/productivity/wellbeing/creativity"},
    ...
  ],
  "summary": "One sentence overall summary"
}`;

        const response = await gptService.sendMessage('You are a personal advisor.', prompt);
        
        const cleaned = response.replace(/```json|```/g, '').trim();
        const analysis = JSON.parse(cleaned);
        
        return analysis;
    } catch (error) {
        console.error('Recommendations error:', error);
        return { 
            recommendations: [], 
            summary: 'Unable to generate recommendations.' 
        };
    }
}

/**
 * Get conversation statistics
 */
async function getConversationStats(userId) {
    try {
        const result = await query(`
            SELECT 
                COUNT(*) as total_conversations,
                COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '7 days') as last_week,
                COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '30 days') as last_month,
                AVG(importance_score) as avg_importance,
                MAX(timestamp) as last_conversation
            FROM episodic_memory
            WHERE user_id = $1
        `, [userId]);
        
        return result.rows[0];
    } catch (error) {
        console.error('Stats error:', error);
        return {};
    }
}

/**
 * Get comprehensive insights
 */
async function getComprehensiveInsights(userId, days = 30) {
    try {
        const [topics, mood, patterns, recommendations, stats] = await Promise.all([
            getTopicsAnalysis(userId, days),
            getMoodAnalysis(userId, days),
            getBehaviorPatterns(userId),
            getRecommendations(userId),
            getConversationStats(userId)
        ]);
        
        return {
            topics,
            mood,
            patterns,
            recommendations,
            stats,
            generated_at: new Date().toISOString()
        };
    } catch (error) {
        console.error('Comprehensive insights error:', error);
        throw error;
    }
}

module.exports = {
    getTopicsAnalysis,
    getMoodAnalysis,
    getBehaviorPatterns,
    getRecommendations,
    getConversationStats,
    getComprehensiveInsights
};
