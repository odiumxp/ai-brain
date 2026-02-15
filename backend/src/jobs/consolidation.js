// Memory Consolidation Job
// Runs daily to strengthen/weaken memories (like sleep consolidation)
const { query } = require('../db/connection');

async function run() {
    try {
        console.log('Starting memory consolidation...');
        
        // Get all users
        const usersResult = await query('SELECT user_id FROM users');
        const users = usersResult.rows;
        
        for (const user of users) {
            await consolidateUserMemories(user.user_id);
        }
        
        console.log(`✅ Memory consolidation complete for ${users.length} users`);
    } catch (error) {
        console.error('❌ Memory consolidation error:', error);
        throw error;
    }
}

async function consolidateUserMemories(userId) {
    try {
        // Call the database function
        await query('SELECT consolidate_memories($1)', [userId]);
        console.log(`  Consolidated memories for user ${userId}`);
    } catch (error) {
        console.error(`  Error consolidating for user ${userId}:`, error);
    }
}

module.exports = { run };
