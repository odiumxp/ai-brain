// Emotional Continuity Service - Amyagdala & Limbic System
// Tracks emotional states, builds empathy, and provides emotional context

const { query } = require('../db/connection');
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Detect emotions from conversation text using AI
 */
async function detectEmotionsFromText(text, userId, contextMemoryId = null) {
    try {
        const prompt = `Analyze the following conversation text and detect the user's emotional state. Consider:

1. Primary emotions: joy, sadness, anger, fear, surprise, disgust, trust, anticipation
2. Emotional intensity (0-10 scale)
3. Confidence in your assessment (0-1 scale)
4. What triggered this emotion
5. Keywords/topics that indicate emotional state
6. Estimated duration of the emotion
7. How an empathetic AI should respond

Return as JSON with this structure:
{
  "emotions": [
    {
      "type": "joy|sadness|anger|fear|surprise|disgust|trust|anticipation",
      "intensity": 0-10,
      "confidence": 0-1,
      "triggers": ["keyword1", "keyword2"],
      "duration_minutes": 30,
      "empathy_response": "How the AI should respond empathetically"
    }
  ],
  "overall_mood": "positive|negative|neutral",
  "emotional_context": "Brief description of emotional state"
}

Conversation text:
${text}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 800,
            temperature: 0.3
        });

        const result = JSON.parse(response.choices[0].message.content);

        // Store detected emotions in database
        if (result.emotions && result.emotions.length > 0) {
            for (const emotion of result.emotions) {
                await storeEmotion(userId, emotion, contextMemoryId, text);
            }
        }

        return result;
    } catch (error) {
        console.error('Error detecting emotions:', error);
        return {
            emotions: [],
            overall_mood: 'neutral',
            emotional_context: 'Unable to analyze emotional state'
        };
    }
}

/**
 * Store emotion in database
 */
async function storeEmotion(userId, emotion, contextMemoryId, triggerText) {
    try {
        await query(`
            INSERT INTO emotional_timeline (
                user_id, emotion_type, intensity, confidence,
                trigger_event, context_memory_id, emotional_triggers,
                duration_minutes, empathy_calibration
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            userId,
            emotion.type,
            emotion.intensity,
            emotion.confidence || 0.8,
            { text: triggerText.substring(0, 500) },
            contextMemoryId,
            emotion.triggers || [],
            emotion.duration_minutes || 30,
            { response: emotion.empathy_response }
        ]);
    } catch (error) {
        console.error('Error storing emotion:', error);
    }
}

/**
 * Get emotional trends over time
 */
async function getEmotionalTrends(userId, days = 30) {
    try {
        const result = await query(`
            SELECT
                emotion_type,
                AVG(intensity) as avg_intensity,
                COUNT(*) as frequency,
                MAX(timestamp) as last_observed,
                json_agg(emotional_triggers) as common_triggers
            FROM emotional_timeline
            WHERE user_id = $1
                AND timestamp > NOW() - INTERVAL '${days} days'
            GROUP BY emotion_type
            ORDER BY avg_intensity DESC
        `, [userId]);

        return result.rows;
    } catch (error) {
        console.error('Error getting emotional trends:', error);
        return [];
    }
}

/**
 * Analyze emotional patterns and build empathy strategies
 */
async function analyzeEmotionalPatterns(userId) {
    try {
        // Get recent emotional data
        const emotions = await query(`
            SELECT * FROM emotional_timeline
            WHERE user_id = $1
                AND timestamp > NOW() - INTERVAL '90 days'
            ORDER BY timestamp DESC
            LIMIT 100
        `, [userId]);

        if (emotions.rows.length === 0) return [];

        // Group by emotion type and analyze patterns
        const patterns = {};
        for (const emotion of emotions.rows) {
            if (!patterns[emotion.emotion_type]) {
                patterns[emotion.emotion_type] = {
                    emotion_type: emotion.emotion_type,
                    triggers: [],
                    responses: [],
                    frequency: 0,
                    avg_intensity: 0
                };
            }

            const pattern = patterns[emotion.emotion_type];
            pattern.frequency++;
            pattern.avg_intensity = (pattern.avg_intensity + emotion.intensity) / 2;

            if (emotion.emotional_triggers) {
                pattern.triggers.push(...emotion.emotional_triggers);
            }

            if (emotion.empathy_calibration?.response) {
                pattern.responses.push(emotion.empathy_calibration.response);
            }
        }

        // Store or update patterns in database
        for (const [emotionType, pattern] of Object.entries(patterns)) {
            // Get most common triggers and responses
            const commonTriggers = getMostCommon(pattern.triggers, 5);
            const commonResponses = getMostCommon(pattern.responses, 3);

            await query(`
                INSERT INTO emotional_patterns (
                    user_id, emotion_type, trigger_patterns, response_patterns,
                    empathy_strategies, frequency_count, confidence_score
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (user_id, emotion_type) DO UPDATE SET
                    trigger_patterns = EXCLUDED.trigger_patterns,
                    response_patterns = EXCLUDED.response_patterns,
                    empathy_strategies = EXCLUDED.empathy_strategies,
                    frequency_count = EXCLUDED.frequency_count,
                    last_observed = NOW(),
                    confidence_score = LEAST(EXCLUDED.confidence_score + 0.1, 0.95)
            `, [
                userId,
                emotionType,
                commonTriggers,
                pattern.responses,
                commonResponses,
                pattern.frequency,
                Math.min(0.5 + (pattern.frequency * 0.05), 0.95)
            ]);
        }

        return Object.values(patterns);
    } catch (error) {
        console.error('Error analyzing emotional patterns:', error);
        return [];
    }
}

/**
 * Get most common items from array
 */
function getMostCommon(arr, limit = 5) {
    const counts = {};
    arr.forEach(item => {
        counts[item] = (counts[item] || 0) + 1;
    });

    return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([item]) => item);
}

/**
 * Generate emotional context for conversations
 */
async function generateEmotionalContext(userId) {
    try {
        // Get recent emotional state
        const recentEmotions = await query(`
            SELECT emotion_type, intensity, timestamp, empathy_calibration
            FROM emotional_timeline
            WHERE user_id = $1
                AND timestamp > NOW() - INTERVAL '24 hours'
            ORDER BY timestamp DESC
            LIMIT 5
        `, [userId]);

        // Get emotional patterns
        const patterns = await query(`
            SELECT emotion_type, empathy_strategies, confidence_score
            FROM emotional_patterns
            WHERE user_id = $1
            ORDER BY confidence_score DESC
            LIMIT 3
        `, [userId]);

        if (recentEmotions.rows.length === 0 && patterns.rows.length === 0) {
            return null;
        }

        let context = "🤗 EMOTIONAL CONTEXT - Recent emotional state and empathy guidelines:\n";

        if (recentEmotions.rows.length > 0) {
            context += "\nRecent Emotions:\n";
            recentEmotions.rows.forEach(emotion => {
                const hoursAgo = Math.round((Date.now() - new Date(emotion.timestamp).getTime()) / (1000 * 60 * 60));
                context += `• ${emotion.emotion_type} (intensity: ${emotion.intensity}/10) - ${hoursAgo} hours ago\n`;
            });
        }

        if (patterns.rows.length > 0) {
            context += "\nLearned Empathy Strategies:\n";
            patterns.rows.forEach(pattern => {
                context += `• For ${pattern.emotion_type}: ${pattern.empathy_strategies?.join(', ') || 'Be supportive and understanding'}\n`;
            });
        }

        context += "\nUse this emotional awareness to respond with appropriate empathy and care.\n\n";

        return context;
    } catch (error) {
        console.error('Error generating emotional context:', error);
        return null;
    }
}

/**
 * Get empathy calibration for specific emotion
 */
async function getEmpathyCalibration(userId, emotionType) {
    try {
        const result = await query(`
            SELECT empathy_strategies, confidence_score
            FROM emotional_patterns
            WHERE user_id = $1 AND emotion_type = $2
            ORDER BY confidence_score DESC
            LIMIT 1
        `, [userId, emotionType]);

        if (result.rows.length > 0) {
            return result.rows[0];
        }

        // Default empathy strategies
        const defaults = {
            joy: ["Share in their happiness", "Be enthusiastic and positive"],
            sadness: ["Be supportive and understanding", "Offer comfort and empathy"],
            anger: ["Stay calm and listen", "Acknowledge their feelings"],
            fear: ["Be reassuring and supportive", "Help them feel safe"],
            surprise: ["Show interest and curiosity", "Match their energy level"],
            disgust: ["Be understanding", "Don't judge their reaction"],
            trust: ["Be reliable and honest", "Build on the positive connection"],
            anticipation: ["Be encouraging", "Share in their excitement"]
        };

        return {
            empathy_strategies: defaults[emotionType] || ["Be supportive and understanding"],
            confidence_score: 0.5
        };
    } catch (error) {
        console.error('Error getting empathy calibration:', error);
        return {
            empathy_strategies: ["Be supportive and understanding"],
            confidence_score: 0.5
        };
    }
}

module.exports = {
    detectEmotionsFromText,
    getEmotionalTrends,
    analyzeEmotionalPatterns,
    generateEmotionalContext,
    getEmpathyCalibration,
    storeEmotion
};
