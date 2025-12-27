/**
 * Reputation and Trust System Utilities
 */

/**
 * Calculate tier based on reputation points
 * @param {number} points - User's reputation points
 * @returns {Object} Tier information with name and color
 */
export function calculateTier(points) {
    const reputationPoints = points || 0;
    
    if (reputationPoints >= 81) {
        return {
            name: 'Distinction',
            color: '#f59e0b', // Gold
            minPoints: 81,
            maxPoints: Infinity
        };
    } else if (reputationPoints >= 51) {
        return {
            name: 'Elite',
            color: '#3b82f6', // Sapphire
            minPoints: 51,
            maxPoints: 80
        };
    } else if (reputationPoints >= 21) {
        return {
            name: 'Scholar',
            color: '#10b981', // Emerald
            minPoints: 21,
            maxPoints: 50
        };
    } else {
        return {
            name: 'Candidate',
            color: '#94a3b8', // Slate
            minPoints: 0,
            maxPoints: 20
        };
    }
}

/**
 * Calculate progress to next tier
 * @param {number} currentPoints - User's current reputation points
 * @returns {Object} Progress information
 */
export function calculateProgress(currentPoints) {
    const currentTier = calculateTier(currentPoints);
    const nextTier = getNextTier(currentTier.name);
    
    if (!nextTier) {
        // User is at max tier
        return {
            currentTier: currentTier.name,
            nextTier: null,
            progress: 100,
            pointsToNext: 0,
            currentPoints: currentPoints,
            nextTierPoints: null
        };
    }
    
    const pointsInCurrentTier = currentPoints - currentTier.minPoints;
    const pointsNeededForNext = nextTier.minPoints - currentTier.minPoints;
    const progress = Math.min(100, Math.max(0, (pointsInCurrentTier / pointsNeededForNext) * 100));
    const pointsToNext = Math.max(0, nextTier.minPoints - currentPoints);
    
    return {
        currentTier: currentTier.name,
        nextTier: nextTier.name,
        progress: Math.round(progress),
        pointsToNext: pointsToNext,
        currentPoints: currentPoints,
        nextTierPoints: nextTier.minPoints
    };
}

/**
 * Get next tier information
 * @param {string} currentTierName - Current tier name
 * @returns {Object|null} Next tier information or null if at max
 */
function getNextTier(currentTierName) {
    const tiers = [
        { name: 'Candidate', minPoints: 0, maxPoints: 20 },
        { name: 'Scholar', minPoints: 21, maxPoints: 50 },
        { name: 'Elite', minPoints: 51, maxPoints: 80 },
        { name: 'Distinction', minPoints: 81, maxPoints: Infinity }
    ];
    
    const currentIndex = tiers.findIndex(t => t.name === currentTierName);
    if (currentIndex === -1 || currentIndex === tiers.length - 1) {
        return null; // At max tier or invalid tier
    }
    
    return tiers[currentIndex + 1];
}

/**
 * Update user's tier based on reputation points
 * @param {Object} db - D1 database instance
 * @param {number} userId - User ID
 * @param {number} newPoints - New reputation points
 * @returns {Promise<Object>} Updated tier information
 */
export async function updateUserTier(db, userId, newPoints) {
    const tier = calculateTier(newPoints);
    
    await db.prepare(
        "UPDATE users SET reputation_points = ?, tier = ? WHERE id = ?"
    )
        .bind(newPoints, tier.name, userId)
        .run();
    
    return tier;
}

/**
 * Calculate user reputation from sales and vouches
 * This function recalculates reputation points from scratch:
 * - Each completed sale = 2 points
 * - Each vouch received = 10 points
 * @param {Object} db - D1 database instance
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Updated reputation and tier information
 */
export async function calculateUserReputation(db, userId) {
    if (!userId) {
        throw new Error('User ID is required');
    }
    
    let salesCount = 0;
    let vouchesCount = 0;
    
    try {
        // Count completed sales (2 points each)
        const salesResult = await db.prepare(
            "SELECT COUNT(*) as count FROM sales WHERE sellerId = ? AND status = 'completed'"
        )
            .bind(userId)
            .first();
        
        salesCount = salesResult?.count || 0;
    } catch (e) {
        console.error('Error counting sales:', e);
        salesCount = 0;
    }
    
    try {
        // Count vouches received (10 points each)
        const vouchesResult = await db.prepare(
            "SELECT COUNT(*) as count FROM sales WHERE sellerId = ? AND is_vouched = 1"
        )
            .bind(userId)
            .first();
        
        vouchesCount = vouchesResult?.count || 0;
    } catch (e) {
        console.error('Error counting vouches:', e);
        vouchesCount = 0;
    }
    
    // Calculate total reputation points: (Sales * 2) + (Vouches * 10)
    const salesPoints = salesCount * 2;
    const vouchesPoints = vouchesCount * 10;
    const totalPoints = salesPoints + vouchesPoints;
    
    // Update user's reputation and tier
    let tier;
    try {
        tier = await updateUserTier(db, userId, totalPoints);
    } catch (e) {
        console.error('Error updating user tier:', e);
        // Fallback to calculating tier without updating database
        tier = calculateTier(totalPoints);
    }
    
    return {
        reputationPoints: totalPoints,
        tier: tier.name,
        salesCount: salesCount,
        vouchesCount: vouchesCount,
        salesPoints: salesPoints,
        vouchesPoints: vouchesPoints
    };
}

