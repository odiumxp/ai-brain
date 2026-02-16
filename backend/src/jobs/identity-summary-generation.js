// Identity Summary Generation Job
// Runs periodically to update identity summaries for all users and personas
const { query } = require('../db/connection');
const identitySummaryEngine = require('../services/identity-summary-engine');

async function run() {
    try {
        console.log('🧠 Starting identity summary generation...');

        // Get all users
        const usersResult = await query('SELECT user_id FROM users');
        const users = usersResult.rows;

        let totalSummaries = 0;

        for (const user of users) {
            const userId = user.user_id;

            // Generate summary for default identity (no persona)
            try {
                await identitySummaryEngine.generateIdentitySummary(userId, null);
                totalSummaries++;
                console.log(`  ✅ Generated identity summary for user ${userId} (default)`);
            } catch (error) {
                console.error(`  ❌ Failed to generate default identity summary for user ${userId}:`, error.message);
            }

            // Generate summaries for each persona
            const personasResult = await query('SELECT persona_id, name FROM ai_personas WHERE user_id = $1', [userId]);
            const personas = personasResult.rows;

            for (const persona of personas) {
                try {
                    await identitySummaryEngine.generateIdentitySummary(userId, persona.persona_id);
                    totalSummaries++;
                    console.log(`  ✅ Generated identity summary for user ${userId}, persona "${persona.name}"`);
                } catch (error) {
                    console.error(`  ❌ Failed to generate identity summary for user ${userId}, persona "${persona.name}":`, error.message);
                }
            }
        }

        console.log(`✅ Identity summary generation complete! Generated ${totalSummaries} summaries for ${users.length} users`);
    } catch (error) {
        console.error('❌ Identity summary generation error:', error);
        throw error;
    }
}

module.exports = { run };
