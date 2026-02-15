// Persona Management Service
const { query } = require('../db/connection');

/**
 * Get all personas for a user
 */
async function getPersonas(userId) {
    const result = await query(`
        SELECT 
            persona_id,
            name,
            description,
            system_prompt,
            avatar_emoji,
            color_theme,
            is_active,
            created_at,
            last_used
        FROM ai_personas
        WHERE user_id = $1
        ORDER BY last_used DESC NULLS LAST, created_at DESC
    `, [userId]);
    
    return result.rows;
}

/**
 * Get active persona for a user
 */
async function getActivePersona(userId) {
    const result = await query(`
        SELECT 
            persona_id,
            name,
            description,
            system_prompt,
            avatar_emoji,
            color_theme
        FROM ai_personas
        WHERE user_id = $1 AND is_active = true
        LIMIT 1
    `, [userId]);
    
    return result.rows[0] || null;
}

/**
 * Create a new persona
 */
async function createPersona(userId, personaData) {
    const { name, description, system_prompt, avatar_emoji, color_theme } = personaData;
    
    const result = await query(`
        INSERT INTO ai_personas (
            user_id, 
            name, 
            description, 
            system_prompt, 
            avatar_emoji, 
            color_theme
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING persona_id, name, description, system_prompt, avatar_emoji, color_theme
    `, [userId, name, description, system_prompt, avatar_emoji || '🤖', color_theme || 'default']);
    
    return result.rows[0];
}

/**
 * Switch to a different persona
 */
async function switchPersona(userId, personaId) {
    // Deactivate all personas for this user
    await query(`
        UPDATE ai_personas
        SET is_active = false
        WHERE user_id = $1
    `, [userId]);
    
    // Activate the selected persona
    const result = await query(`
        UPDATE ai_personas
        SET is_active = true, last_used = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND persona_id = $2
        RETURNING persona_id, name, description, system_prompt, avatar_emoji, color_theme
    `, [userId, personaId]);
    
    return result.rows[0];
}

/**
 * Update a persona
 */
async function updatePersona(personaId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (updates.name !== undefined) {
        fields.push(`name = $${paramCount++}`);
        values.push(updates.name);
    }
    if (updates.description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        values.push(updates.description);
    }
    if (updates.system_prompt !== undefined) {
        fields.push(`system_prompt = $${paramCount++}`);
        values.push(updates.system_prompt);
    }
    if (updates.avatar_emoji !== undefined) {
        fields.push(`avatar_emoji = $${paramCount++}`);
        values.push(updates.avatar_emoji);
    }
    if (updates.color_theme !== undefined) {
        fields.push(`color_theme = $${paramCount++}`);
        values.push(updates.color_theme);
    }
    
    if (fields.length === 0) {
        throw new Error('No fields to update');
    }
    
    values.push(personaId);
    
    const result = await query(`
        UPDATE ai_personas
        SET ${fields.join(', ')}
        WHERE persona_id = $${paramCount}
        RETURNING *
    `, values);
    
    return result.rows[0];
}

/**
 * Delete a persona
 */
async function deletePersona(personaId) {
    await query(`
        DELETE FROM ai_personas
        WHERE persona_id = $1
    `, [personaId]);
}

/**
 * Get persona stats (memory count, etc)
 */
async function getPersonaStats(personaId) {
    const result = await query(`
        SELECT 
            COUNT(*) as memory_count,
            MAX(timestamp) as last_conversation
        FROM episodic_memory
        WHERE persona_id = $1
    `, [personaId]);
    
    return result.rows[0];
}

/**
 * Create default personas for a new user
 */
async function createDefaultPersonas(userId) {
    const defaultPersonas = [
        {
            name: 'General Assistant',
            description: 'Your everyday AI companion for general conversations and tasks',
            system_prompt: 'You are a helpful, friendly AI assistant. Be conversational and natural.',
            avatar_emoji: '🤖',
            color_theme: 'default'
        },
        {
            name: 'Work Coach',
            description: 'Professional assistant focused on productivity and career growth',
            system_prompt: 'You are a professional work coach. Focus on productivity, career advice, and professional development. Be direct and action-oriented.',
            avatar_emoji: '💼',
            color_theme: 'blue'
        },
        {
            name: 'Creative Partner',
            description: 'Imaginative collaborator for brainstorming and creative projects',
            system_prompt: 'You are a creative partner. Think outside the box, suggest wild ideas, and help brainstorm. Be enthusiastic and encouraging.',
            avatar_emoji: '🎨',
            color_theme: 'purple'
        },
        {
            name: 'Learning Tutor',
            description: 'Patient teacher helping you learn new skills and concepts',
            system_prompt: 'You are a patient, knowledgeable tutor. Break down complex topics, ask questions to check understanding, and provide clear explanations.',
            avatar_emoji: '📚',
            color_theme: 'green'
        }
    ];
    
    const created = [];
    for (const persona of defaultPersonas) {
        const result = await createPersona(userId, persona);
        created.push(result);
    }
    
    // Set first one as active
    if (created.length > 0) {
        await switchPersona(userId, created[0].persona_id);
    }
    
    return created;
}

module.exports = {
    getPersonas,
    getActivePersona,
    createPersona,
    switchPersona,
    updatePersona,
    deletePersona,
    getPersonaStats,
    createDefaultPersonas
};
