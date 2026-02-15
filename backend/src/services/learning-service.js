// Learning Mode Service - Integrates with Learning Tutor persona
const { query } = require('../db/connection');
const gptService = require('./gpt-service');
const personaService = require('./persona-service');

/**
 * Get the Learning Tutor persona for a user
 */
async function getLearningTutorPersona(userId) {
    const personas = await personaService.getPersonas(userId);
    const tutor = personas.find(p => p.name === 'Learning Tutor');
    
    if (!tutor) {
        throw new Error('Learning Tutor persona not found. Please initialize default personas first.');
    }
    
    return tutor;
}

/**
 * Generate quiz questions from recent conversations with Learning Tutor
 */
async function generateQuiz(userId, topic = null, count = 5) {
    try {
        // Get the Learning Tutor persona
        const tutorPersona = await getLearningTutorPersona(userId);
        
        // Get recent conversations with the Learning Tutor
        const result = await query(`
            SELECT conversation_text
            FROM episodic_memory
            WHERE user_id = $1
            AND persona_id = $2
            ORDER BY timestamp DESC
            LIMIT 50
        `, [userId, tutorPersona.persona_id]);
        
        if (result.rows.length === 0) {
            return { 
                questions: [], 
                message: 'No learning conversations yet. Chat with the Learning Tutor first!' 
            };
        }
        
        // Extract conversation content
        const conversations = result.rows.map(row => {
            const conv = typeof row.conversation_text === 'string'
                ? JSON.parse(row.conversation_text)
                : row.conversation_text;
            return `User: ${conv.user}\nTutor: ${conv.ai}`;
        }).join('\n\n');
        
        // Generate quiz using GPT
        const prompt = `Based on these learning conversations, generate ${count} quiz questions that test understanding of the concepts discussed.

Conversations:
${conversations.substring(0, 4000)}

${topic ? `Focus specifically on: ${topic}` : ''}

Respond ONLY with valid JSON in this format:
{
  "questions": [
    {
      "question": "Question text",
      "answer": "Correct answer explanation",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_option": 0,
      "topic": "Topic name",
      "difficulty": "easy/medium/hard"
    }
  ]
}`;

        const response = await gptService.sendMessage(
            tutorPersona.system_prompt || 'You are a knowledgeable tutor.',
            prompt
        );
        
        const cleaned = response.replace(/```json|```/g, '').trim();
        const quizData = JSON.parse(cleaned);
        
        // Store questions in database
        for (const q of quizData.questions) {
            await query(`
                INSERT INTO learning_items (
                    user_id, 
                    persona_id, 
                    topic, 
                    question, 
                    answer, 
                    difficulty,
                    next_review
                )
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [
                userId,
                tutorPersona.persona_id,
                q.topic,
                JSON.stringify({ question: q.question, options: q.options, correct: q.correct_option }),
                q.answer,
                q.difficulty
            ]);
        }
        
        return quizData;
    } catch (error) {
        console.error('Generate quiz error:', error);
        throw error;
    }
}

/**
 * Get items due for review (spaced repetition)
 */
async function getDueItems(userId, limit = 10) {
    try {
        const tutorPersona = await getLearningTutorPersona(userId);
        
        const result = await query(`
            SELECT 
                item_id,
                topic,
                question,
                answer,
                difficulty,
                mastery_level,
                review_count
            FROM learning_items
            WHERE user_id = $1
            AND persona_id = $2
            AND (next_review IS NULL OR next_review <= NOW())
            ORDER BY next_review ASC NULLS FIRST, mastery_level ASC
            LIMIT $3
        `, [userId, tutorPersona.persona_id, limit]);
        
        return result.rows.map(row => ({
            ...row,
            question: typeof row.question === 'string' ? JSON.parse(row.question) : row.question
        }));
    } catch (error) {
        console.error('Get due items error:', error);
        throw error;
    }
}

/**
 * Submit answer and update mastery
 */
async function submitAnswer(itemId, correct) {
    try {
        const item = await query(`
            SELECT mastery_level, review_count
            FROM learning_items
            WHERE item_id = $1
        `, [itemId]);
        
        if (item.rows.length === 0) {
            throw new Error('Item not found');
        }
        
        const currentMastery = item.rows[0].mastery_level;
        const reviewCount = item.rows[0].review_count;
        
        // Calculate new mastery level (0-5 scale)
        let newMastery = currentMastery;
        if (correct) {
            newMastery = Math.min(5, currentMastery + 1);
        } else {
            newMastery = Math.max(0, currentMastery - 1);
        }
        
        // Calculate next review time using spaced repetition
        // Intervals: 1 day, 3 days, 1 week, 2 weeks, 1 month, 3 months
        const intervals = [1, 3, 7, 14, 30, 90];
        const daysUntilReview = intervals[newMastery] || 1;
        
        // Update the item
        await query(`
            UPDATE learning_items
            SET 
                mastery_level = $1,
                last_reviewed = NOW(),
                next_review = NOW() + INTERVAL '${daysUntilReview} days',
                review_count = review_count + 1,
                correct_count = correct_count + $2
            WHERE item_id = $3
        `, [newMastery, correct ? 1 : 0, itemId]);
        
        return {
            newMastery,
            nextReview: `${daysUntilReview} days`,
            correct
        };
    } catch (error) {
        console.error('Submit answer error:', error);
        throw error;
    }
}

/**
 * Start a study session
 */
async function startStudySession(userId, topic = null) {
    try {
        const result = await query(`
            INSERT INTO study_sessions (user_id, topic, started_at)
            VALUES ($1, $2, NOW())
            RETURNING session_id
        `, [userId, topic]);
        
        return result.rows[0].session_id;
    } catch (error) {
        console.error('Start session error:', error);
        throw error;
    }
}

/**
 * Complete a study session
 */
async function completeStudySession(sessionId, itemsReviewed, itemsCorrect, durationMinutes) {
    try {
        await query(`
            UPDATE study_sessions
            SET 
                items_reviewed = $1,
                items_correct = $2,
                duration_minutes = $3,
                completed_at = NOW()
            WHERE session_id = $4
        `, [itemsReviewed, itemsCorrect, durationMinutes, sessionId]);
    } catch (error) {
        console.error('Complete session error:', error);
        throw error;
    }
}

/**
 * Get learning statistics
 */
async function getLearningStats(userId) {
    try {
        const tutorPersona = await getLearningTutorPersona(userId);
        
        const [itemsStats, sessionStats, masteryStats] = await Promise.all([
            query(`
                SELECT 
                    COUNT(*) as total_items,
                    COUNT(*) FILTER (WHERE next_review <= NOW()) as due_today,
                    AVG(mastery_level) as avg_mastery
                FROM learning_items
                WHERE user_id = $1 AND persona_id = $2
            `, [userId, tutorPersona.persona_id]),
            
            query(`
                SELECT 
                    COUNT(*) as total_sessions,
                    SUM(items_reviewed) as total_reviewed,
                    SUM(items_correct) as total_correct,
                    AVG(duration_minutes) as avg_duration
                FROM study_sessions
                WHERE user_id = $1
            `, [userId]),
            
            query(`
                SELECT 
                    mastery_level,
                    COUNT(*) as count
                FROM learning_items
                WHERE user_id = $1 AND persona_id = $2
                GROUP BY mastery_level
                ORDER BY mastery_level
            `, [userId, tutorPersona.persona_id])
        ]);
        
        return {
            items: itemsStats.rows[0],
            sessions: sessionStats.rows[0],
            mastery: masteryStats.rows
        };
    } catch (error) {
        console.error('Get stats error:', error);
        throw error;
    }
}

/**
 * Get topics being studied
 */
async function getStudyTopics(userId) {
    try {
        const tutorPersona = await getLearningTutorPersona(userId);
        
        const result = await query(`
            SELECT 
                topic,
                COUNT(*) as item_count,
                AVG(mastery_level) as avg_mastery
            FROM learning_items
            WHERE user_id = $1 AND persona_id = $2
            GROUP BY topic
            ORDER BY item_count DESC
        `, [userId, tutorPersona.persona_id]);
        
        return result.rows;
    } catch (error) {
        console.error('Get topics error:', error);
        throw error;
    }
}

module.exports = {
    generateQuiz,
    getDueItems,
    submitAnswer,
    startStudySession,
    completeStudySession,
    getLearningStats,
    getStudyTopics,
    getLearningTutorPersona
};
