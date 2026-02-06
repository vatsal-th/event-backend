const HostingApplication = require('../models/HostingApplication');
const EventApplication = require('../models/EventApplication');
const AgencyApplication = require('../models/AgencyApplication');
const InfluencerApplication = require('../models/InfluencerApplication');
const User = require('../models/userModel');
const ActivityLog = require('../models/activityLogModel');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * Calculates and awards points to a user upon application approval
 * @param {string} userId - ID of the user to reward
 * @param {string} adminId - ID of the admin performing the approval
 * @param {string} currentAppId - ID of the application being approved
 * @param {string} appType - Type of application ('Hosting' or 'Event')
 * @returns {Promise<number>} - The amount of points awarded
 */
exports.issueApplicationReward = async (userId, adminId, currentAppId, appType, applicantName) => {
    try {
        // Check for ANY previous approved applications (excluding current one)
        const approvedHostingCount = await HostingApplication.countDocuments({
            userId,
            status: 'Approved',
            _id: { $ne: currentAppId }
        });

        const approvedEventCount = await EventApplication.countDocuments({
            userId,
            status: 'Approved',
            _id: { $ne: currentAppId }
        });

        const approvedAgencyCount = await AgencyApplication.countDocuments({
            userId,
            status: 'Approved',
            _id: { $ne: currentAppId }
        });

        const approvedInfluencerCount = await InfluencerApplication.countDocuments({
            userId,
            status: 'Approved',
            _id: { $ne: currentAppId }
        });

        const totalPreviouslyApproved = approvedHostingCount + approvedEventCount + approvedAgencyCount + approvedInfluencerCount;
        const isFirstTime = totalPreviouslyApproved === 0;

        // Calculate points
        const min = isFirstTime ? 1000 : 1;
        const max = 2000;
        const rewardPoints = Math.floor(Math.random() * (max - min + 1)) + min;

        // Update User points
        await User.findByIdAndUpdate(userId, {
            $inc: { points: rewardPoints }
        });

        // Create wallet transaction for application reward
        await WalletTransaction.create({
            userId: userId,
            transactionType: 'application_reward',
            amount: rewardPoints,
            description: `${appType} application approved - ${isFirstTime ? 'First time bonus' : 'Recurring'} reward`,
            relatedId: currentAppId,
            relatedModel: `${appType}Application`,
        });

        // Log the reward action
        await ActivityLog.create({
            user: adminId,
            action: `Issued ${appType} Reward`,
            details: `Awarded ${rewardPoints} points to ${applicantName || 'User'} for ${appType} approval (${isFirstTime ? 'First Time' : 'Recurring'})`
        });

        return rewardPoints;
    } catch (error) {
        console.error('Error in issueApplicationReward:', error);
        throw error;
    }
};
