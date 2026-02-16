// User Model Service - Theory of Mind and Belief Tracking
const { query } = require('../db/connection');
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Extract beliefs from conversation text using AI
 */
async function extractBeliefsFromText(text, userId) {
    try {
        const prompt = `Analyze the following conversation text and extract any beliefs, opinions, or convictions expressed by the user. Focus on:

1. Explicit statements of belief ("I believe that...", "I'm convinced that...")
2. Strong opinions or values
3. Philosophical or ethical stances
4. Political, religious, or ideological positions
5. Personal principles or life philosophies

For each belief identified, provide:
- The belief statement (paraphrase if needed for clarity)
- Category (religious, political, scientific, personal, ethical, etc.)
- Confidence level (0-1, how certain they seem)
- Strength (0-1, how strongly held)

Return as JSON array of belief objects.

Conversation text:
${text}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000,
            temperature: 0.3
        });

        const result = JSON.parse(response.choices[0].message.content);
        return Array.isArray(result) ? result : [];
    } catch (error) {
        console.error('Error extracting beliefs:', error);
        return [];
    }
}

/**
 * Extract goals and objectives from conversation
 */
async function extractGoalsFromText(text, userId) {
    try {
        const prompt = `Analyze the following conversation and identify any goals, objectives, or aspirations mentioned by the user. Look for:

1. Explicit goals ("I want to...", "My goal is...")
2. Future plans or ambitions
3. Learning objectives
4. Career aspirations
5. Personal development targets
6. Problem-solving objectives

For each goal identified, provide:
- Goal description (clear, actionable statement)
- Category (career, personal, learning, relationship, health, etc.)
- Priority level (1-10, how important it seems)
- Success criteria (how they'll know when it's achieved)

Return as JSON array of goal objects.

Conversation text:
${text}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 800,
            temperature: 0.3
        });

        const result = JSON.parse(response.choices[0].message.content);
        return Array.isArray(result) ? result : [];
    } catch (error) {
        console.error('Error extracting goals:', error);
        return [];
    }
}

/**
 * Infer current mental state from recent interactions
 */
async function inferMentalState(userId, recentMemories = 10) {
    try {
        // Get recent memories
        const memoriesResult = await query(`
            SELECT conversation_text, emotional_context, timestamp
            FROM episodic_memory
            WHERE user_id = $1
            ORDER BY timestamp DESC
            LIMIT $2
        `, [userId, recentMemories]);

        if (memoriesResult.rows.length === 0) return null;

        const conversationText = memoriesResult.rows
            .map(m => {
                const conv = typeof m.conversation_text === 'string'
                    ? JSON.parse(m.conversation_text)
                    : m.conversation_text;
                return `User: ${conv.user}\nAI: ${conv.ai}`;
            })
            .join('\n\n');

        const prompt = `Based on this recent conversation history, infer the user's current mental/emotional state. Analyze:

1. Dominant emotion (joy, sadness, anger, fear, surprise, etc.)
2. Emotional intensity (0-1 scale)
3. Cognitive load (low, normal, high, overwhelmed)
4. Attention focus (what they seem preoccupied with)
5. Decision making style (analytical, intuitive, emotional, practical)
6. Communication style (direct, indirect, verbose, concise)
7. Stress indicators (signs of anxiety, frustration, etc.)
8. Motivation level (low, neutral, high, very high)
9. Inferred needs (what they might need right now)

Return as a JSON object with these fields.

Recent conversations:
${conversationText}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 600,
            temperature: 0.4
        });

        const mentalState = JSON.parse(response.choices[0].message.content);

        // Store the mental state
        const result = await query(`
            INSERT INTO mental_states
            (user_id, dominant_emotion, emotional_intensity, cognitive_load,
             attention_focus, decision_making_style, communication_style,
             stress_indicators, motivation_level, inferred_needs, confidence_score)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING state_id
        `, [
            userId,
            mentalState.dominant_emotion,
            mentalState.emotional_intensity || 0.5,
            mentalState.cognitive_load || 'normal',
            mentalState.attention_focus,
            mentalState.decision_making_style,
            mentalState.communication_style,
            mentalState.stress_indicators || [],
            mentalState.motivation_level || 'neutral',
            mentalState.inferred_needs || [],
            0.7 // Default confidence for AI inference
        ]);

        return result.rows[0].state_id;
    } catch (error) {
        console.error('Error inferring mental state:', error);
        return null;
    }
}

/**
 * Store or update a user belief
 */
async function storeUserBelief(userId, beliefData, memoryId = null) {
    try {
        // Check if belief already exists
        const existingResult = await query(`
            SELECT belief_id, belief_strength, evidence_sources
            FROM user_beliefs
            WHERE user_id = $1 AND belief_statement = $2
        `, [userId, beliefData.belief_statement]);

        if (existingResult.rows.length > 0) {
            // Update existing belief
            const existing = existingResult.rows[0];
            const newStrength = Math.min(1.0, existing.belief_strength + 0.1);
            const newEvidence = memoryId ?
                [...(existing.evidence_sources || []), memoryId] :
                existing.evidence_sources;

            await query(`
                UPDATE user_beliefs
                SET belief_strength = $1,
                    evidence_sources = $2,
                    last_reinforced = NOW(),
                    confidence_level = GREATEST(confidence_level, $3)
                WHERE belief_id = $4
            `, [newStrength, newEvidence, beliefData.confidence_level || 0.5, existing.belief_id]);

            return existing.belief_id;
        } else {
            // Create new belief
            const result = await query(`
                INSERT INTO user_beliefs
                (user_id, belief_statement, belief_category, confidence_level,
                 evidence_sources, first_expressed, belief_strength)
                VALUES ($1, $2, $3, $4, $5, NOW(), $6)
                RETURNING belief_id
            `, [
                userId,
                beliefData.belief_statement,
                beliefData.category,
                beliefData.confidence_level || 0.5,
                memoryId ? [memoryId] : [],
                beliefData.strength || 0.5
            ]);

            return result.rows[0].belief_id;
        }
    } catch (error) {
        console.error('Error storing user belief:', error);
        throw error;
    }
}

/**
 * Store or update a user goal
 */
async function storeUserGoal(userId, goalData, memoryId = null) {
    try {
        // Check for similar existing goals
        const existingResult = await query(`
            SELECT goal_id, progress_percentage, status
            FROM user_goals
            WHERE user_id = $1 AND goal_description = $2
        `, [userId, goalData.goal_description]);

        if (existingResult.rows.length > 0) {
            // Update existing goal
            const existing = existingResult.rows[0];
            await query(`
                UPDATE user_goals
                SET last_updated = NOW(),
                    priority_level = GREATEST(priority_level, $1)
                WHERE goal_id = $2
            `, [goalData.priority_level || 5, existing.goal_id]);

            return existing.goal_id;
        } else {
            // Create new goal
            const result = await query(`
                INSERT INTO user_goals
                (user_id, goal_description, goal_category, priority_level,
                 success_criteria, first_mentioned)
                VALUES ($1, $2, $3, $4, $5, NOW())
                RETURNING goal_id
            `, [
                userId,
                goalData.goal_description,
                goalData.category,
                goalData.priority_level || 5,
                goalData.success_criteria
            ]);

            return result.rows[0].goal_id;
        }
    } catch (error) {
        console.error('Error storing user goal:', error);
        throw error;
    }
}

/**
 * Process a new conversation for belief/goal extraction
 */
async function processConversationForUserModel(userId, conversationText, memoryId) {
    try {
        console.log(`Processing conversation for user model: ${userId}`);

        // Extract beliefs
        const beliefs = await extractBeliefsFromText(conversationText, userId);
        for (const belief of beliefs) {
            await storeUserBelief(userId, belief, memoryId);
        }

        // Extract goals
        const goals = await extractGoalsFromText(conversationText, userId);
        for (const goal of goals) {
            await storeUserGoal(userId, goal, memoryId);
        }

        // Infer mental state (less frequently, maybe every few conversations)
        const shouldInferState = Math.random() < 0.3; // 30% chance
        if (shouldInferState) {
            await inferMentalState(userId);
        }

        return {
            beliefsExtracted: beliefs.length,
            goalsExtracted: goals.length,
            mentalStateInferred: shouldInferState
        };
    } catch (error) {
        console.error('Error processing conversation for user model:', error);
        return { beliefsExtracted: 0, goalsExtracted: 0, mentalStateInferred: false };
    }
}

/**
 * Get user's current mental state
 */
async function getCurrentMentalState(userId) {
    try {
        const result = await query(`
            SELECT * FROM mental_states
            WHERE user_id = $1
            ORDER BY timestamp DESC
            LIMIT 1
        `, [userId]);

        return result.rows[0] || null;
    } catch (error) {
        console.error('Error getting current mental state:', error);
        return null;
    }
}

/**
 * Get user's beliefs by category
 */
async function getUserBeliefs(userId, category = null, limit = 20) {
    try {
        let queryText = `
            SELECT * FROM user_beliefs
            WHERE user_id = $1 AND is_active = true
        `;
        const params = [userId];

        if (category) {
            queryText += ` AND belief_category = $2`;
            params.push(category);
        }

        queryText += ` ORDER BY belief_strength DESC, last_reinforced DESC LIMIT $${params.length + 1}`;

        const result = await query(queryText, [...params, limit]);
        return result.rows;
    } catch (error) {
        console.error('Error getting user beliefs:', error);
        return [];
    }
}

/**
 * Get user's active goals
 */
async function getUserGoals(userId, status = 'active', limit = 10) {
    try {
        const result = await query(`
            SELECT * FROM user_goals
            WHERE user_id = $1 AND status = $2
            ORDER BY priority_level DESC, created_at DESC
            LIMIT $3
        `, [userId, status, limit]);

        return result.rows;
    } catch (error) {
        console.error('Error getting user goals:', error);
        return [];
    }
}

/**
 * Update goal progress
 */
async function updateGoalProgress(userId, goalId, progressPercentage, status = null) {
    try {
        const updates = [];
        const params = [progressPercentage, userId, goalId];
        let paramCount = 3;

        let queryText = `
            UPDATE user_goals
            SET progress_percentage = $1, last_updated = NOW()
        `;

        if (status) {
            queryText += `, status = $${++paramCount}`;
            params.push(status);
        }

        queryText += ` WHERE user_id = $2 AND goal_id = $3`;

        await query(queryText, params);
        return true;
    } catch (error) {
        console.error('Error updating goal progress:', error);
        return false;
    }
}

/**
 * Get comprehensive user model
 */
async function getUserModel(userId) {
    try {
        const [beliefs, goals, values, mentalState] = await Promise.all([
            getUserBeliefs(userId, null, 15),
            getUserGoals(userId, 'active', 10),
            getUserValues(userId),
            getCurrentMentalState(userId)
        ]);

        return {
            userId,
            beliefs: beliefs.map(b => ({
                id: b.belief_id,
                statement: b.belief_statement,
                category: b.belief_category,
                strength: b.belief_strength,
                confidence: b.confidence_level
            })),
            goals: goals.map(g => ({
                id: g.goal_id,
                description: g.goal_description,
                category: g.goal_category,
                priority: g.priority_level,
                progress: g.progress_percentage,
                status: g.status
            })),
            values: values,
            currentMentalState: mentalState ? {
                emotion: mentalState.dominant_emotion,
                intensity: mentalState.emotional_intensity,
                cognitiveLoad: mentalState.cognitive_load,
                motivation: mentalState.motivation_level,
                needs: mentalState.inferred_needs
            } : null,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error getting user model:', error);
        return null;
    }
}

/**
 * Get user values (placeholder for now)
 */
async function getUserValues(userId) {
    // This would be expanded with value extraction logic
    return [];
}

/**
 * Generate context from user model for conversations
 */
function generateUserModelContext(userModel) {
    if (!userModel) return '';

    let context = '## USER MODEL CONTEXT\n';

    // Add current mental state
    if (userModel.currentMentalState) {
        context += `**Current Mental State:** ${userModel.currentMentalState.emotion || 'neutral'} `;
        context += `(motivation: ${userModel.currentMentalState.motivation || 'neutral'}, `;
        context += `cognitive load: ${userModel.currentMentalState.cognitiveLoad || 'normal'})\n`;
    }

    // Add key beliefs
    if (userModel.beliefs && userModel.beliefs.length > 0) {
        context += '**Key Beliefs:** ';
        const topBeliefs = userModel.beliefs.slice(0, 3);
        context += topBeliefs.map(b => `${b.statement} (${b.category})`).join('; ') + '\n';
    }

    // Add active goals
    if (userModel.goals && userModel.goals.length > 0) {
        context += '**Active Goals:** ';
        const topGoals = userModel.goals.slice(0, 2);
        context += topGoals.map(g => `${g.description} (${g.progress}% complete)`).join('; ') + '\n';
    }

    context += '\n';

    return context;
}

module.exports = {
    processConversationForUserModel,
    getUserModel,
    getCurrentMentalState,
    getUserBeliefs,
    getUserGoals,
    updateGoalProgress,
    storeUserBelief,
    storeUserGoal,
    inferMentalState,
    generateUserModelContext
};
