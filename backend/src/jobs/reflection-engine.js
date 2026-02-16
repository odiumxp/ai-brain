// Reflection Engine Job
// Performs periodic self-analysis and meta-cognition
const reflectionEngine = require('../services/reflection-engine');
const { query } = require('../db/connection');

async function run() {
    try {
        console.log('🧠 Starting reflection engine analysis...');

        // Get all users
        const usersResult = await query('SELECT user_id FROM users');
        const users = usersResult.rows;

        let totalReflections = 0;

        for (const user of users) {
            const userId = user.user_id;

            try {
                // Perform weekly reflection
                const reflection = await reflectionEngine.performSelfReflection(userId, 'week');
                totalReflections++;

                console.log(`  ✅ Completed reflection for user ${userId}`);
                console.log(`     📊 Analyzed ${reflection.patterns?.totalMemories || 0} memories`);
                console.log(`     🧠 Generated insights: ${reflection.insights?.substring(0, 100)}...`);

            } catch (error) {
                console.error(`  ❌ Failed reflection for user ${userId}:`, error.message);
            }
        }

        console.log(`✅ Reflection engine complete! Generated ${totalReflections} reflections for ${users.length} users`);

    } catch (error) {
        console.error('❌ Reflection engine error:', error);
        throw error;
    }
}

module.exports = { run };
