// User Model Maintenance Job - Updates user beliefs, goals, and mental states
const cron = require('node-cron');
const { query } = require('../db/connection');
const userModelService = require('../services/user-model-service');

let isRunning = false;

/**
 * Process recent conversations for user model updates
 */
async function processRecentConversations() {
    try {
        console.log('Processing recent conversations for user model updates...');

        // Get active users (users with conversations in the last 7 days)
        const activeUsersResult = await query(`
            SELECT DISTINCT user_id
            FROM episodic_memory
            WHERE timestamp > NOW() - INTERVAL '7 days'
        `);

        let totalProcessed = 0;

        for (const user of activeUsersResult.rows) {
            // Get conversations from the last 24 hours that haven't been processed for user model
            const conversationsResult = await query(`
                SELECT memory_id, conversation_text, timestamp
                FROM episodic_memory
                WHERE user_id = $1
                AND timestamp > NOW() - INTERVAL '24 hours'
                ORDER BY timestamp DESC
                LIMIT 20
            `, [user.user_id]);

            for (const conv of conversationsResult.rows) {
                const convText = typeof conv.conversation_text === 'string'
                    ? JSON.parse(conv.conversation_text)
                    : conv.conversation_text;

                const fullText = `User: ${convText.user}\nAI: ${convText.ai}`;

                await userModelService.processConversationForUserModel(
                    user.user_id,
                    fullText,
                    conv.memory_id
                );

                totalProcessed++;
            }
        }

        console.log(`Processed ${totalProcessed} conversations for ${activeUsersResult.rows.length} users`);
    } catch (error) {
        console.error('Error processing recent conversations:', error);
    }
}

/**
 * Update goal progress based on conversation analysis
 */
async function updateGoalProgressFromConversations() {
    try {
        console.log('Analyzing conversations for goal progress updates...');

        // Get active goals
        const activeGoalsResult = await query(`
            SELECT goal_id, user_id, goal_description, success_criteria, progress_percentage
            FROM user_goals
            WHERE status = 'active'
            AND last_updated < NOW() - INTERVAL '1 day'
            LIMIT 50
        `);

        for (const goal of activeGoalsResult.rows) {
            // Look for recent conversations that might indicate progress
            const recentConversationsResult = await query(`
                SELECT conversation_text
                FROM episodic_memory
                WHERE user_id = $1
                AND timestamp > NOW() - INTERVAL '3 days'
                ORDER BY timestamp DESC
                LIMIT 10
            `, [goal.user_id]);

            // Simple progress detection (could be enhanced with AI)
            let progressIndicators = 0;
            const goalWords = goal.goal_description.toLowerCase().split(' ');

            for (const conv of recentConversationsResult.rows) {
                const convText = JSON.stringify(conv.conversation_text).toLowerCase();

                // Count how many goal-related words appear in recent conversations
                const matches = goalWords.filter(word =>
                    word.length > 3 && convText.includes(word)
                ).length;

                if (matches > 0) progressIndicators++;
            }

            // If we see progress indicators, slightly increase progress
            if (progressIndicators > 2 && goal.progress_percentage < 90) {
                const newProgress = Math.min(90, goal.progress_percentage + 5);
                await userModelService.updateGoalProgress(goal.user_id, goal.goal_id, newProgress);
                console.log(`Updated goal ${goal.goal_id} progress to ${newProgress}%`);
            }
        }
    } catch (error) {
        console.error('Error updating goal progress:', error);
    }
}

/**
 * Clean up inactive or outdated user model data
 */
async function cleanupUserModelData() {
    try {
        console.log('Cleaning up user model data...');

        // Deactivate beliefs that haven't been reinforced in 90 days
        const beliefCleanupResult = await query(`
            UPDATE user_beliefs
            SET is_active = false
            WHERE last_reinforced < NOW() - INTERVAL '90 days'
            AND belief_strength < 0.3
        `);

        // Mark old goals as abandoned if no progress in 60 days
        const goalCleanupResult = await query(`
            UPDATE user_goals
            SET status = 'abandoned'
            WHERE status = 'active'
            AND last_updated < NOW() - INTERVAL '60 days'
            AND progress_percentage = 0
        `);

        // Remove very old mental states (keep last 100 per user)
        await query(`
            DELETE FROM mental_states
            WHERE state_id IN (
                SELECT state_id FROM (
                    SELECT state_id,
                           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY timestamp DESC) as rn
                    FROM mental_states
                ) ranked
                WHERE rn > 100
            )
        `);

        console.log(`Cleaned up ${beliefCleanupResult.rowCount} beliefs and ${goalCleanupResult.rowCount} goals`);
    } catch (error) {
        console.error('Error cleaning up user model data:', error);
    }
}

/**
 * Strengthen active beliefs and goals based on reinforcement patterns
 */
async function strengthenActiveModels() {
    try {
        console.log('Strengthening active user models...');

        // Increase strength of recently reinforced beliefs
        await query(`
            UPDATE user_beliefs
            SET belief_strength = LEAST(1.0, belief_strength * 1.05)
            WHERE last_reinforced > NOW() - INTERVAL '7 days'
            AND is_active = true
        `);

        // Update goal priorities based on recent mentions
        const recentGoalsResult = await query(`
            SELECT DISTINCT ug.goal_id
            FROM user_goals ug
            JOIN episodic_memory em ON em.user_id = ug.user_id
            WHERE ug.status = 'active'
            AND em.timestamp > NOW() - INTERVAL '3 days'
            AND POSITION(LOWER(ug.goal_description) IN LOWER(em.conversation_text::text)) > 0
        `);

        for (const goal of recentGoalsResult.rows) {
            await query(`
                UPDATE user_goals
                SET priority_level = LEAST(10, priority_level + 1),
                    last_updated = NOW()
                WHERE goal_id = $1
            `, [goal.goal_id]);
        }

        console.log(`Strengthened ${recentGoalsResult.rows.length} recently mentioned goals`);
    } catch (error) {
        console.error('Error strengthening active models:', error);
    }
}

/**
 * Main maintenance function
 */
async function runUserModelMaintenance() {
    if (isRunning) {
        console.log('User model maintenance already running, skipping...');
        return;
    }

    isRunning = true;
    const startTime = Date.now();

    try {
        console.log('🧠 Starting User Model Maintenance...');

        // Step 1: Process recent conversations
        await processRecentConversations();

        // Step 2: Update goal progress
        await updateGoalProgressFromConversations();

        // Step 3: Strengthen active models
        await strengthenActiveModels();

        // Step 4: Clean up old data
        await cleanupUserModelData();

        const duration = (Date.now() - startTime) / 1000;
        console.log(`✅ User Model Maintenance completed in ${duration.toFixed(1)}s`);

    } catch (error) {
        console.error('❌ User Model Maintenance failed:', error);
    } finally {
        isRunning = false;
    }
}

/**
 * Initialize the user model maintenance job
 */
function initializeUserModelJob() {
    // Run daily at 1 AM
    cron.schedule('0 1 * * *', () => {
        runUserModelMaintenance();
    });

    // Also run weekly deep analysis on Sundays at 2 AM
    cron.schedule('0 2 * * 0', async () => {
        console.log('🔍 Running weekly user model deep analysis...');

        try {
            // Trigger mental state inference for all active users
            const activeUsersResult = await query(`
                SELECT DISTINCT user_id
                FROM episodic_memory
                WHERE timestamp > NOW() - INTERVAL '7 days'
            `);

            for (const user of activeUsersResult.rows) {
                await userModelService.inferMentalState(user.user_id, 20);
            }

            console.log(`✅ Weekly mental state analysis completed for ${activeUsersResult.rows.length} users`);
        } catch (error) {
            console.error('❌ Weekly user model analysis failed:', error);
        }
    });

    console.log('🧠 User Model Maintenance job initialized (daily at 1 AM, weekly analysis Sundays at 2 AM)');
}

/**
 * Manual trigger for testing
 */
async function triggerManualMaintenance() {
    console.log('🧠 Manually triggering user model maintenance...');
    await runUserModelMaintenance();
}

module.exports = {
    initializeUserModelJob,
    runUserModelMaintenance,
    triggerManualMaintenance
};
