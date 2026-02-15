// Personality Service - Manages AI personality traits and evolution
const { query } = require('../db/connection');

/**
 * Get current personality state for a user
 */
async function getPersonality(userId) {
    try {
        const result = await query(`
            SELECT trait_name, current_value
            FROM personality_state
            WHERE user_id = $1
        `, [userId]);
        
        // Convert to object
        const personality = {};
        result.rows.forEach(row => {
            personality[row.trait_name] = row.current_value;
        });
        
        return personality;
    } catch (error) {
        console.error('Error getting personality:', error);
        throw error;
    }
}

/**
 * Update personality based on recent conversations
 */
async function updatePersonality(userId) {
    try {
        // Get recent conversations (last 7 days)
        const recentConvos = await query(`
            SELECT conversation_text, emotional_context
            FROM episodic_memory
            WHERE user_id = $1 
            AND timestamp > NOW() - INTERVAL '7 days'
            ORDER BY timestamp DESC
            LIMIT 50
        `, [userId]);
        
        if (recentConvos.rows.length === 0) {
            console.log('No recent conversations to analyze');
            return;
        }
        
        // Analyze traits from conversations
        const traits = analyzeTraits(recentConvos.rows);
        
        // Update each trait (90% old value, 10% new trend)
        for (const [traitName, newValue] of Object.entries(traits)) {
            await query(`
                UPDATE personality_state
                SET 
                    current_value = (current_value * 0.9) + ($1 * 0.1),
                    historical_values = jsonb_set(
                        historical_values,
                        ARRAY[$2],
                        to_jsonb(current_value)
                    ),
                    last_modified = NOW()
                WHERE user_id = $3 AND trait_name = $4
            `, [newValue, new Date().toISOString().split('T')[0], userId, traitName]);
        }
        
        console.log(`✅ Personality updated for user ${userId}`);
    } catch (error) {
        console.error('Error updating personality:', error);
        throw error;
    }
}

/**
 * Analyze personality traits from conversation history
 * This is a simplified version - in production, use Claude API for better analysis
 */
function analyzeTraits(conversations) {
    const traits = {
        humor: 0,
        empathy: 0,
        directness: 0,
        formality: 0,
        enthusiasm: 0,
        curiosity: 0,
        patience: 0
    };
    
    let totalCount = 0;
    
    conversations.forEach(convo => {
        const text = JSON.stringify(convo.conversation_text).toLowerCase();
        totalCount++;
        
        // Humor markers
        if (text.match(/haha|lol|😂|funny|joke|lmao/)) {
            traits.humor += 1;
        }
        
        // Empathy markers
        if (text.match(/understand|feel|sorry|care about|support|here for you/)) {
            traits.empathy += 1;
        }
        
        // Directness markers
        if (text.match(/directly|honestly|bluntly|straightforward|cut to the chase/)) {
            traits.directness += 1;
        }
        
        // Formality markers (inverse - more casual language = less formal)
        const casualCount = (text.match(/yeah|nah|gonna|wanna|cool|awesome/g) || []).length;
        const formalCount = (text.match(/please|thank you|would you|kindly|sir|madam/g) || []).length;
        if (casualCount > formalCount) {
            // More casual = lower formality score
            traits.formality -= 0.5;
        } else if (formalCount > casualCount) {
            traits.formality += 1;
        }
        
        // Enthusiasm markers
        const exclamationCount = (text.match(/!/g) || []).length;
        if (exclamationCount > 2) {
            traits.enthusiasm += 1;
        }
        
        // Curiosity markers
        const questionCount = (text.match(/\?/g) || []).length;
        if (questionCount > 1) {
            traits.curiosity += 1;
        }
        
        // Patience markers (longer, more detailed responses)
        if (text.length > 800) {
            traits.patience += 1;
        }
    });
    
    // Normalize to 0-10 scale
    Object.keys(traits).forEach(key => {
        traits[key] = Math.max(0, Math.min(10, (traits[key] / totalCount) * 10));
        
        // For formality, need to handle negative values differently
        if (key === 'formality') {
            // Center around 5, with adjustments
            traits[key] = Math.max(0, Math.min(10, 5 + traits[key]));
        }
    });
    
    return traits;
}

/**
 * Get personality evolution history
 */
async function getPersonalityHistory(userId, traitName = null) {
    try {
        let queryText = `
            SELECT trait_name, current_value, historical_values, last_modified
            FROM personality_state
            WHERE user_id = $1
        `;
        
        const params = [userId];
        
        if (traitName) {
            queryText += ` AND trait_name = $2`;
            params.push(traitName);
        }
        
        const result = await query(queryText, params);
        return result.rows;
    } catch (error) {
        console.error('Error getting personality history:', error);
        throw error;
    }
}

/**
 * Initialize personality for a new user
 */
async function initializePersonality(userId) {
    try {
        const defaultTraits = [
            'humor', 'empathy', 'directness', 
            'formality', 'enthusiasm', 'curiosity', 'patience'
        ];
        
        for (const trait of defaultTraits) {
            await query(`
                INSERT INTO personality_state (user_id, trait_name, current_value)
                VALUES ($1, $2, 5.0)
                ON CONFLICT (user_id, trait_name) DO NOTHING
            `, [userId, trait]);
        }
        
        console.log(`✅ Personality initialized for user ${userId}`);
    } catch (error) {
        console.error('Error initializing personality:', error);
        throw error;
    }
}

module.exports = {
    getPersonality,
    updatePersonality,
    getPersonalityHistory,
    initializePersonality,
    analyzeTraits
};
