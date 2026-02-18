const User = require('../models/userModel');
const ReferralLog = require('../models/ReferralLog');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * Generate a unique 4-5 character alphanumeric invite ID
 * @returns {Promise<string>} - Unique invite ID
 */
exports.generateInviteId = async () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = Math.random() < 0.5 ? 4 : 5; // Randomly choose 4 or 5 characters

    let inviteId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
        inviteId = '';
        for (let i = 0; i < length; i++) {
            inviteId += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        // Check if this inviteId already exists
        const existingUser = await User.findOne({ inviteId });
        if (!existingUser) {
            isUnique = true;
        }
        attempts++;
    }

    if (!isUnique) {
        throw new Error('Failed to generate unique invite ID after multiple attempts');
    }

    return inviteId;
};

/**
 * Process referral when a new user registers with a referral code (Logs only)
 * @param {string} referralCode - The invite code used by the new user
 * @param {string} newUserId - ID of the newly registered user
 * @returns {Promise<Object>} - Result object with success status and details
 */
exports.processReferral = async (referralCode, newUserId) => {
    try {
        // Find the referrer by their invite code
        const referrer = await User.findOne({ inviteId: referralCode });

        if (!referrer) {
            return {
                success: false,
                message: 'Invalid referral code',
            };
        }

        // Check if user is trying to use their own referral code
        if (referrer._id.toString() === newUserId.toString()) {
            return {
                success: false,
                message: 'Cannot use your own referral code',
            };
        }

        const rewardPoints = 10;

        // Save who referred this user
        await User.findByIdAndUpdate(newUserId, {
            referredBy: referrer._id
        });

        // Create referral log (Pending status)
        const referralLog = await ReferralLog.create({
            referrerId: referrer._id,
            referredUserId: newUserId,
            inviteCode: referralCode,
            rewardPoints,
            status: 'Pending'
        });

        return {
            success: true,
            message: 'Referral linkage saved. Reward will be issued after first service approval.',
            referrerId: referrer._id,
        };
    } catch (error) {
        console.error('Error processing referral:', error);
        return {
            success: false,
            message: 'Error processing referral',
            error: error.message,
        };
    }
};

/**
 * Award the referral reward to the referrer when the referred user's application is approved
 * @param {string} referredUserId - ID of the user who was referred
 * @returns {Promise<void>}
 */
exports.completeReferral = async (referredUserId) => {
    try {
        // Find pending referral log
        const referralLog = await ReferralLog.findOne({ 
            referredUserId, 
            status: 'Pending' 
        });

        if (!referralLog) return;

        // Award points to referrer
        await User.findByIdAndUpdate(referralLog.referrerId, {
            $inc: { points: referralLog.rewardPoints }
        });

        // Create wallet transaction for referrer
        await WalletTransaction.create({
            userId: referralLog.referrerId,
            transactionType: 'referral_reward',
            amount: referralLog.rewardPoints,
            description: `Referral reward for user activity - Approved Service`,
            relatedId: referralLog._id,
            relatedModel: 'ReferralLog',
        });

        // Mark log as completed
        referralLog.status = 'Completed';
        await referralLog.save();

        console.log(`Referral reward of ${referralLog.rewardPoints} points issued to referrer ${referralLog.referrerId}`);
    } catch (error) {
        console.error('Error completing referral:', error);
    }
};
