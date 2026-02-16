// Personality Consolidation Job
// Runs periodically to stabilize personality evolution and prevent chaotic drift
const { query } = require('../db/connection');

async function run() {
    try {
        console.log('🎭 Starting personality consolidation...');

        // Get all users
        const usersResult = await query('SELECT user_id FROM users');
        const users = usersResult.rows;

        for (const user of users) {
            await consolidatePersonality(user.user_id);
        }

        console.log(`✅ Personality consolidation complete for ${users.length} users`);
    } catch (error) {
        console.error('❌ Personality consolidation error:', error);
        throw error;
    }
}

/**
 * Consolidate personality traits for a user
 * This stabilizes evolution by reinforcing consistent trends and smoothing fluctuations
 */
async function consolidatePersonality(userId) {
    try {
        // Get personality state with historical data
        const personalityResult = await query(`
            SELECT trait_name, current_value, historical_values,
                   last_modified, created_at
            FROM personality_state
            WHERE user_id = $1
        `, [userId]);

        if (personalityResult.rows.length === 0) {
            console.log(`  No personality data for user ${userId}`);
            return;
        }

        console.log(`  Consolidating personality for user ${userId}...`);

        for (const trait of personalityResult.rows) {
            await consolidateTrait(userId, trait);
        }

        console.log(`  ✅ Consolidated personality for user ${userId}`);
    } catch (error) {
        console.error(`  Error consolidating personality for user ${userId}:`, error);
        throw error;
    }
}

/**
 * Consolidate a single personality trait
 * Analyzes historical trends and stabilizes the current value
 */
async function consolidateTrait(userId, trait) {
    const { trait_name, current_value, historical_values, last_modified, created_at } = trait;

    // Calculate trait age (days since creation)
    const ageDays = Math.max(1, Math.floor((Date.now() - new Date(created_at).getTime()) / (1000 * 60 * 60 * 24)));

    // Extract historical values (last 30 days if available)
    let historicalTrends = [];
    if (historical_values && typeof historical_values === 'object') {
        // Get values from the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        historicalTrends = Object.entries(historical_values)
            .filter(([date]) => new Date(date) >= thirtyDaysAgo)
            .map(([, value]) => parseFloat(value))
            .filter(val => !isNaN(val));
    }

    // Calculate consolidation factors
    const stabilityFactor = calculateStabilityFactor(historicalTrends, current_value);
    const trendStrength = calculateTrendStrength(historicalTrends);
    const ageMultiplier = Math.min(1, ageDays / 30); // Traits stabilize over time

    // Consolidated value calculation:
    // - More stable traits change less
    // - Stronger trends are reinforced
    // - Older traits are more resistant to change
    const consolidatedValue = calculateConsolidatedValue(
        current_value,
        historicalTrends,
        stabilityFactor,
        trendStrength,
        ageMultiplier
    );

    // Update the trait with consolidated value
    await query(`
        UPDATE personality_state
        SET
            current_value = $1,
            last_consolidated = NOW(),
            consolidation_count = COALESCE(consolidation_count, 0) + 1
        WHERE user_id = $2 AND trait_name = $3
    `, [consolidatedValue, userId, trait_name]);

    console.log(`    ${trait_name}: ${current_value.toFixed(2)} → ${consolidatedValue.toFixed(2)} (stability: ${stabilityFactor.toFixed(2)})`);
}

/**
 * Calculate how stable a trait has been (lower variance = more stable)
 */
function calculateStabilityFactor(historicalValues, currentValue) {
    if (historicalValues.length < 3) return 0.5; // Default moderate stability

    const values = [...historicalValues, currentValue];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Convert std dev to stability factor (0-1, higher = more stable)
    return Math.max(0.1, Math.min(1, 1 - (stdDev / 2)));
}

/**
 * Calculate the strength of recent trends
 */
function calculateTrendStrength(historicalValues) {
    if (historicalValues.length < 5) return 0.5;

    // Calculate linear trend (slope)
    const n = historicalValues.length;
    const xMean = (n - 1) / 2;
    const yMean = historicalValues.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    historicalValues.forEach((y, i) => {
        numerator += (i - xMean) * (y - yMean);
        denominator += Math.pow(i - xMean, 2);
    });

    const slope = denominator === 0 ? 0 : numerator / denominator;

    // Convert slope to trend strength (0-1)
    return Math.max(0, Math.min(1, Math.abs(slope) * 10));
}

/**
 * Calculate the consolidated value based on all factors
 */
function calculateConsolidatedValue(currentValue, historicalValues, stabilityFactor, trendStrength, ageMultiplier) {
    // Base consolidation: pull toward historical mean but respect stability
    let consolidatedValue = currentValue;

    if (historicalValues.length > 0) {
        const historicalMean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;

        // Stability prevents wild swings, trend strength reinforces direction
        const convergenceRate = (1 - stabilityFactor) * 0.3; // 0-30% convergence to mean
        const trendInfluence = trendStrength * 0.2; // 0-20% trend reinforcement

        // Age makes traits more resistant to change
        const resistance = ageMultiplier * 0.8; // 0-80% resistance

        consolidatedValue = currentValue * (1 - convergenceRate - trendInfluence) +
            historicalMean * convergenceRate +
            (currentValue + (historicalValues[historicalValues.length - 1] - historicalValues[0])) * trendInfluence;

        // Apply resistance
        consolidatedValue = currentValue * resistance + consolidatedValue * (1 - resistance);
    }

    // Ensure value stays within bounds (0-1 for personality traits)
    return Math.max(0, Math.min(1, consolidatedValue));
}

module.exports = { run };
