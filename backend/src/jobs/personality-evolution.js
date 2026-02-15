// Personality Evolution Job
// Runs daily to update personality traits based on recent interactions
const { query } = require('../db/connection');
const personalityService = require('../services/personality-service');

async function run() {
    try {
        console.log('Starting personality evolution...');
        
        // Get all users
        const usersResult = await query('SELECT user_id FROM users');
        const users = usersResult.rows;
        
        for (const user of users) {
            await personalityService.updatePersonality(user.user_id);
        }
        
        console.log(`✅ Personality evolution complete for ${users.length} users`);
    } catch (error) {
        console.error('❌ Personality evolution error:', error);
        throw error;
    }
}

module.exports = { run };
