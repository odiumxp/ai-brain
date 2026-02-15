// Connection Decay Job
// Runs weekly to decay unused neural connections
const { query } = require('../db/connection');

async function run() {
    try {
        console.log('Starting connection decay...');
        
        // Get all users
        const usersResult = await query('SELECT user_id FROM users');
        const users = usersResult.rows;
        
        for (const user of users) {
            await query('SELECT decay_connections($1)', [user.user_id]);
            console.log(`  Decayed connections for user ${user.user_id}`);
        }
        
        console.log(`✅ Connection decay complete for ${users.length} users`);
    } catch (error) {
        console.error('❌ Connection decay error:', error);
        throw error;
    }
}

module.exports = { run };
