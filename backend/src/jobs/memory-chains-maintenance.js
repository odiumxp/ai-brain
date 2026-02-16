// Memory Chains Maintenance Job - Automatically builds and maintains memory chains
const cron = require('node-cron');
const { query } = require('../db/connection');
const memoryChainsService = require('../services/memory-chains-service');

let isRunning = false;

/**
 * Clean up old or weak memory chains
 */
async function cleanupMemoryChains() {
    try {
        console.log('Starting memory chains cleanup...');

        // Remove chains with very low strength that haven't been accessed recently
        const cleanupResult = await query(`
            DELETE FROM memory_chains
            WHERE chain_strength < 0.2
            AND access_count = 0
            AND created_at < NOW() - INTERVAL '30 days'
        `);

        console.log(`Cleaned up ${cleanupResult.rowCount} weak memory chains`);

        // Update chain strengths based on access patterns
        await query(`
            UPDATE memory_chains
            SET chain_strength = GREATEST(0.1, chain_strength * 0.9 + access_count * 0.01)
            WHERE last_updated < NOW() - INTERVAL '7 days'
        `);

        console.log('Updated memory chain strengths');
    } catch (error) {
        console.error('Error during memory chains cleanup:', error);
    }
}

/**
 * Rebuild chains for active users
 */
async function rebuildChainsForActiveUsers() {
    try {
        console.log('Rebuilding memory chains for active users...');

        // Find users who have been active in the last week
        const activeUsersResult = await query(`
            SELECT DISTINCT user_id
            FROM episodic_memory
            WHERE timestamp > NOW() - INTERVAL '7 days'
        `);

        let totalChainsCreated = 0;

        for (const user of activeUsersResult.rows) {
            const chainsCreated = await memoryChainsService.buildMemoryChains(user.user_id, 5, 14);
            totalChainsCreated += chainsCreated;
        }

        console.log(`Rebuilt memory chains: created ${totalChainsCreated} new chains for ${activeUsersResult.rows.length} active users`);
    } catch (error) {
        console.error('Error rebuilding chains for active users:', error);
    }
}

/**
 * Analyze and strengthen important chains
 */
async function strengthenImportantChains() {
    try {
        console.log('Strengthening important memory chains...');

        // Find chains that are frequently accessed or have high strength
        const importantChainsResult = await query(`
            SELECT chain_id, user_id, chain_strength, access_count
            FROM memory_chains
            WHERE (chain_strength > 0.7 OR access_count > 10)
            AND last_updated < NOW() - INTERVAL '1 day'
            LIMIT 20
        `);

        for (const chain of importantChainsResult.rows) {
            // Re-analyze relationships and potentially extend the chain
            const chainDetails = await memoryChainsService.getChainMemories(chain.user_id, chain.chain_id);

            if (chainDetails && chainDetails.memories.length > 0) {
                const lastMemoryId = chainDetails.memories[chainDetails.memories.length - 1].memory_id;

                // Look for new memories to add to this chain
                const newRelationships = await memoryChainsService.detectMemoryRelationships(
                    chain.user_id,
                    lastMemoryId,
                    20
                );

                if (newRelationships.length > 0 && newRelationships[0].strength > 0.5) {
                    // Extend the chain with the new memory
                    const extendedSequence = [...chainDetails.memories.map(m => m.memory_id), newRelationships[0].relatedMemoryId];

                    await query(`
                        UPDATE memory_chains
                        SET memory_sequence = $1,
                            end_memory_id = $2,
                            chain_strength = GREATEST(chain_strength, $3),
                            last_updated = NOW()
                        WHERE chain_id = $4
                    `, [extendedSequence, newRelationships[0].relatedMemoryId, newRelationships[0].strength, chain.chain_id]);

                    console.log(`Extended chain ${chain.chain_id} with new memory`);
                }
            }
        }
    } catch (error) {
        console.error('Error strengthening important chains:', error);
    }
}

/**
 * Main maintenance function
 */
async function runMemoryChainsMaintenance() {
    if (isRunning) {
        console.log('Memory chains maintenance already running, skipping...');
        return;
    }

    isRunning = true;
    const startTime = Date.now();

    try {
        console.log('🔗 Starting Memory Chains Maintenance...');

        // Step 1: Clean up old chains
        await cleanupMemoryChains();

        // Step 2: Rebuild chains for active users
        await rebuildChainsForActiveUsers();

        // Step 3: Strengthen important chains
        await strengthenImportantChains();

        const duration = (Date.now() - startTime) / 1000;
        console.log(`✅ Memory Chains Maintenance completed in ${duration.toFixed(1)}s`);

    } catch (error) {
        console.error('❌ Memory Chains Maintenance failed:', error);
    } finally {
        isRunning = false;
    }
}

/**
 * Initialize the memory chains maintenance job
 */
function initializeMemoryChainsJob() {
    // Run daily at 2 AM
    cron.schedule('0 2 * * *', () => {
        runMemoryChainsMaintenance();
    });

    // Also run weekly maintenance on Sundays at 3 AM
    cron.schedule('0 3 * * 0', async () => {
        console.log('🧹 Running weekly memory chains deep cleanup...');

        try {
            // More aggressive cleanup for old chains
            await query(`
                DELETE FROM memory_chains
                WHERE access_count = 0
                AND created_at < NOW() - INTERVAL '90 days'
            `);

            console.log('✅ Weekly memory chains cleanup completed');
        } catch (error) {
            console.error('❌ Weekly memory chains cleanup failed:', error);
        }
    });

    console.log('🔗 Memory Chains Maintenance job initialized (daily at 2 AM, weekly cleanup Sundays at 3 AM)');
}

/**
 * Manual trigger for testing
 */
async function triggerManualMaintenance() {
    console.log('🔗 Manually triggering memory chains maintenance...');
    await runMemoryChainsMaintenance();
}

module.exports = {
    initializeMemoryChainsJob,
    runMemoryChainsMaintenance,
    triggerManualMaintenance
};
