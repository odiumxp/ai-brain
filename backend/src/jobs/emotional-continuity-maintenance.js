// Emotional Continuity Maintenance Job
// Runs daily to analyze emotional patterns and update empathy calibration

const cron = require('node-cron');
const emotionalContinuityService = require('../services/emotional-continuity-service');
const { query } = require('../db/connection');

const USER_ID = 'f9364170-b5d7-4239-affd-1eea6ad5dac2'; // Default user

/**
 * Process recent conversations for emotional analysis
 */
async function processRecentConversations() {
    try {
        console.log('🧠 Processing recent conversations for emotional analysis...');

        // Get conversations from the last 24 hours that haven't been emotionally analyzed
        const conversations = await query(`
            SELECT em.memory_id, em.conversation_text, em.timestamp
            FROM episodic_memory em
            LEFT JOIN emotional_timeline et ON em.memory_id = et.context_memory_id
            WHERE em.user_id = $1
                AND em.timestamp > NOW() - INTERVAL '24 hours'
                AND et.context_memory_id IS NULL
            ORDER BY em.timestamp DESC
            LIMIT 20
        `, [USER_ID]);

        console.log(`Found ${conversations.rows.length} conversations to analyze`);

        for (const conversation of conversations.rows) {
            try {
                // Extract conversation text
                const conversationText = Array.isArray(conversation.conversation_text)
                    ? conversation.conversation_text.map(msg => `${msg.role}: ${msg.content}`).join('\n')
                    : JSON.stringify(conversation.conversation_text);

                // Detect emotions
                await emotionalContinuityService.detectEmotionsFromText(
                    conversationText,
                    USER_ID,
                    conversation.memory_id
                );

                console.log(`✓ Analyzed emotions for conversation at ${conversation.timestamp}`);
            } catch (error) {
                console.error(`Error analyzing conversation ${conversation.memory_id}:`, error);
            }
        }

        console.log('✅ Emotional analysis complete');
    } catch (error) {
        console.error('Error in processRecentConversations:', error);
    }
}

/**
 * Analyze emotional patterns and update empathy strategies
 */
async function analyzeEmotionalPatterns() {
    try {
        console.log('🧠 Analyzing emotional patterns...');

        const patterns = await emotionalContinuityService.analyzeEmotionalPatterns(USER_ID);

        console.log(`✓ Updated ${patterns.length} emotional patterns`);

        // Clean up old emotional data (keep last 6 months)
        const cleanupResult = await query(`
            DELETE FROM emotional_timeline
            WHERE user_id = $1
                AND timestamp < NOW() - INTERVAL '6 months'
        `, [USER_ID]);

        if (cleanupResult.rowCount > 0) {
            console.log(`🗑️ Cleaned up ${cleanupResult.rowCount} old emotional records`);
        }

        console.log('✅ Emotional pattern analysis complete');
    } catch (error) {
        console.error('Error in analyzeEmotionalPatterns:', error);
    }
}

/**
 * Generate emotional trend reports
 */
async function generateEmotionalTrends() {
    try {
        console.log('🧠 Generating emotional trend reports...');

        const trends = await emotionalContinuityService.getEmotionalTrends(USER_ID, 30);

        if (trends.length > 0) {
            console.log('📊 Current Emotional Trends (30 days):');
            trends.forEach(trend => {
                console.log(`  ${trend.emotion_type}: ${trend.avg_intensity.toFixed(1)} avg intensity, ${trend.frequency} occurrences`);
            });
        }

        console.log('✅ Emotional trend analysis complete');
    } catch (error) {
        console.error('Error in generateEmotionalTrends:', error);
    }
}

/**
 * Initialize emotional continuity maintenance job
 * Runs daily at 3 AM (after memory chains at 2 AM, before reflection at 7 AM)
 */
function initializeEmotionalContinuityJob() {
    console.log('🤗 Initializing Emotional Continuity Maintenance Job...');

    // Daily emotional analysis at 3 AM
    cron.schedule('0 3 * * *', async () => {
        console.log('🤗 Running daily emotional continuity maintenance...');

        try {
            await processRecentConversations();
            await analyzeEmotionalPatterns();
            await generateEmotionalTrends();

            console.log('🤗 Daily emotional continuity maintenance completed');
        } catch (error) {
            console.error('Error in daily emotional continuity maintenance:', error);
        }
    });

    // Weekly deep analysis on Sundays at 4 AM
    cron.schedule('0 4 * * 0', async () => {
        console.log('🤗 Running weekly emotional deep analysis...');

        try {
            // Analyze longer-term patterns (90 days)
            const longTermTrends = await emotionalContinuityService.getEmotionalTrends(USER_ID, 90);
            console.log('📈 Long-term Emotional Trends (90 days):');
            longTermTrends.forEach(trend => {
                console.log(`  ${trend.emotion_type}: ${trend.avg_intensity.toFixed(1)} avg intensity, ${trend.frequency} occurrences`);
            });

            // Re-analyze all patterns with fresh data
            await analyzeEmotionalPatterns();

            console.log('🤗 Weekly emotional deep analysis completed');
        } catch (error) {
            console.error('Error in weekly emotional deep analysis:', error);
        }
    });

    console.log('🤗 Emotional Continuity Maintenance Job initialized');
    console.log('🤗 Daily: 3 AM - Process conversations & update patterns');
    console.log('🤗 Weekly: Sunday 4 AM - Deep emotional analysis');
}

module.exports = {
    initializeEmotionalContinuityJob,
    processRecentConversations,
    analyzeEmotionalPatterns,
    generateEmotionalTrends
};
