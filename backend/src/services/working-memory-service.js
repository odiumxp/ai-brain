// Working Memory Service - Simulates human working memory
// Keeps track of active topics, unresolved questions, and conversation goals

const { query } = require('../db/connection');
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Get or create active working memory session for user
 */
async function getActiveSession(userId, personaId = null) {
    try {
        // Try to get existing active session (within last hour)
        let result = await query(`
            SELECT * FROM working_memory
            WHERE user_id = $1
            AND is_active = true
            AND last_activity > NOW() - INTERVAL '1 hour'
            ORDER BY last_activity DESC
            LIMIT 1
        `, [userId]);

        if (result.rows.length > 0) {
            return result.rows[0];
        }

        // Create new session
        result = await query(`
            INSERT INTO working_memory (user_id, persona_id)
            VALUES ($1, $2)
            RETURNING *
        `, [userId, personaId]);

        return result.rows[0];
    } catch (error) {
        console.error('Error getting working memory session:', error);
        throw error;
    }
}

/**
 * Analyze message to extract topics, questions, and goals
 */
async function analyzeMessage(userMessage, aiResponse, currentSession) {
    try {
        const prompt = `Analyze this conversation exchange and extract:
1. Main topics being discussed (max 5, keep it brief)
2. Any questions the user asked that weren't fully answered
3. The user's apparent goal/intent in this conversation
4. Current emotional tone

Current active topics: ${JSON.stringify(currentSession.active_topics || [])}
Current unresolved questions: ${JSON.stringify(currentSession.unresolved_questions || [])}

User: ${userMessage}
AI: ${aiResponse}

Respond ONLY with valid JSON:
{
  "topics": ["topic1", "topic2"],
  "newQuestions": [{"question": "text", "timestamp": "now"}],
  "resolvedQuestions": ["question text that was answered"],
  "conversationGoal": "brief goal description",
  "emotionalTone": {"type": "curious/happy/concerned/neutral", "intensity": 0-1}
}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a conversation analyzer. Respond only with valid JSON.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 300,
            temperature: 0.3
        });

        const analysis = JSON.parse(response.choices[0].message.content);

        // Merge with existing session data
        const existingTopics = currentSession.active_topics || [];
        const existingQuestions = currentSession.unresolved_questions || [];

        // Add new topics, keep only last 5
        const allTopics = [...new Set([...analysis.topics, ...existingTopics])];
        const activeTopics = allTopics.slice(0, 5);

        // Remove resolved questions, add new ones
        const unresolvedQuestions = existingQuestions.filter(q =>
            !analysis.resolvedQuestions.includes(q.question)
        );
        unresolvedQuestions.push(...(analysis.newQuestions || []));

        return {
            activeTopics,
            unresolvedQuestions: unresolvedQuestions.slice(0, 5), // Keep max 5
            conversationGoal: analysis.conversationGoal,
            emotionalState: analysis.emotionalTone
        };
    } catch (error) {
        console.error('Error analyzing message:', error);
        // Fallback to simple topic extraction
        return {
            activeTopics: extractSimpleTopics(userMessage, currentSession.active_topics || []),
            unresolvedQuestions: currentSession.unresolved_questions || [],
            conversationGoal: currentSession.conversation_goal || 'general conversation',
            emotionalState: { type: 'neutral', intensity: 0.5 }
        };
    }
}

/**
 * Simple topic extraction fallback
 */
function extractSimpleTopics(message, currentTopics) {
    // Very basic topic extraction from keywords
    const words = message.toLowerCase().split(/\s+/);
    const importantWords = words.filter(w => w.length > 4);

    if (importantWords.length > 0) {
        const newTopic = importantWords[0];
        return [newTopic, ...currentTopics].slice(0, 5);
    }

    return currentTopics;
}

/**
 * Update working memory with new conversation
 */
async function updateWorkingMemory(userId, userMessage, aiResponse, personaId = null) {
    try {
        const session = await getActiveSession(userId, personaId);

        // Analyze the new message
        const analysis = await analyzeMessage(userMessage, aiResponse, session);

        // Update session
        await query(`
            UPDATE working_memory
            SET
                active_topics = $1::jsonb,
                unresolved_questions = $2::jsonb,
                conversation_goal = $3,
                emotional_state = $4::jsonb,
                last_activity = NOW(),
                updated_at = NOW()
            WHERE session_id = $5
        `, [
            JSON.stringify(analysis.activeTopics),
            JSON.stringify(analysis.unresolvedQuestions),
            analysis.conversationGoal,
            JSON.stringify(analysis.emotionalState),
            session.session_id
        ]);

        console.log(`💭 Working Memory Updated - Topics: [${analysis.activeTopics.join(', ')}]`);

        return analysis;
    } catch (error) {
        console.error('Error updating working memory:', error);
        throw error;
    }
}

/**
 * Get working memory context for conversation
 */
async function getWorkingMemoryContext(userId, personaId = null) {
    try {
        const session = await getActiveSession(userId, personaId);

        if (!session || !session.active_topics || session.active_topics.length === 0) {
            return null;
        }

        // Build context string
        let context = '[WORKING MEMORY - CURRENT CONVERSATION STATE - THIS IS THE MOST IMPORTANT CONTEXT]\n';
        context += 'This represents the user\'s current thoughts and what they are actively thinking about RIGHT NOW.\n\n';

        if (session.active_topics && session.active_topics.length > 0) {
            context += `Active topics in this ongoing conversation: ${session.active_topics.join(', ')}.\n`;
            context += `🚨 CRITICAL INSTRUCTION: When the user asks vague questions like "what do you think?", "tell me more", "how about that?", or similar ambiguous questions, they are ALWAYS referring to the CURRENT ACTIVE TOPICS listed above. Do NOT ask for clarification - respond based on these topics.\n`;
        }

        if (session.unresolved_questions && session.unresolved_questions.length > 0) {
            const questions = session.unresolved_questions.map(q => q.question).join('; ');
            context += `User previously asked these questions that may need follow-up: ${questions}.\n`;
        }

        if (session.conversation_goal) {
            context += `User's goal in this conversation: ${session.conversation_goal}.\n`;
        }

        // Calculate session duration
        const duration = Math.floor((new Date() - new Date(session.session_start)) / 1000 / 60);
        if (duration > 5) {
            context += `This conversation has been ongoing for ${duration} minutes - maintain continuity.\n`;
        } else if (duration < 2) {
            context += `This is a fresh conversation just starting.\n`;
        }

        context += '\n⚠️ REMEMBER: For any vague or ambiguous user questions, always relate your response to the active topics above.\n';

        return context;
    } catch (error) {
        console.error('Error getting working memory context:', error);
        return null;
    }
}

/**
 * Clear old sessions (called by cron job)
 */
async function clearOldSessions() {
    try {
        await query(`
            UPDATE working_memory
            SET is_active = false
            WHERE last_activity < NOW() - INTERVAL '1 hour'
            AND is_active = true
        `);
    } catch (error) {
        console.error('Error clearing old sessions:', error);
    }
}

module.exports = {
    getActiveSession,
    updateWorkingMemory,
    getWorkingMemoryContext,
    clearOldSessions
};
