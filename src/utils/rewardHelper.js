const HostingApplication = require("../models/HostingApplication");
const EventApplication = require("../models/EventApplication");
const AgencyApplication = require("../models/AgencyApplication");
const InfluencerApplication = require("../models/InfluencerApplication");
const User = require("../models/userModel");
const ActivityLog = require("../models/activityLogModel");
const WalletTransaction = require("../models/WalletTransaction");
const referralHelper = require("./referralHelper");

/**
 * Calculates and awards points to a user upon application approval
 * @param {string} userId - ID of the user to reward
 * @param {string} adminId - ID of the admin performing the approval
 * @param {string} currentAppId - ID of the application being approved
 * @param {string} appType - Type of application ('Hosting' or 'Event')
 * @returns {Promise<number>} - The amount of points awarded
 */
exports.issueApplicationReward = async (
  userId,
  adminId,
  currentAppId,
  appType,
  applicantName,
) => {
  try {
    // Check if user's wallet is frozen
    const user = await User.findById(userId);
    if (user && user.isWalletFrozen) {
      console.log(
        `User ${userId} wallet is frozen. Skipping reward calculation.`,
      );
      return 0;
    }

    // Check for ANY previous approved applications (excluding current one)
    const approvedHostingCount = await HostingApplication.countDocuments({
      userId,
      status: "Approved",
      _id: { $ne: currentAppId },
    });

    const approvedEventCount = await EventApplication.countDocuments({
      userId,
      status: "Approved",
      _id: { $ne: currentAppId },
    });

    const approvedAgencyCount = await AgencyApplication.countDocuments({
      userId,
      status: "Approved",
      _id: { $ne: currentAppId },
    });

    const approvedInfluencerCount = await InfluencerApplication.countDocuments({
      userId,
      status: "Approved",
      _id: { $ne: currentAppId },
    });

    const totalPreviouslyApproved =
      approvedHostingCount +
      approvedEventCount +
      approvedAgencyCount +
      approvedInfluencerCount;
    const isFirstTime = totalPreviouslyApproved === 0;

    // Calculate points
    const min = isFirstTime ? 1000 : 1;
    const max = 2000;
    const rewardPoints = Math.floor(Math.random() * (max - min + 1)) + min;

    // NOTE: We don't update User points or create WalletTransaction here anymore.
    // This will be handled in scratchApplicationReward when the user scratches the card.

    // Log the reward calculation action
    await ActivityLog.create({
      user: adminId,
      action: `Calculated ${appType} Reward`,
      details: `Calculated ${rewardPoints} points for ${applicantName || "User"} for ${appType} approval. Reward will be issued after scratching.`,
    });

    // Check if this user was referred by someone and reward them
    // Referral reward happens on approval, but we still check if referrer is frozen inside completeReferral
    await referralHelper.completeReferral(userId);

    return rewardPoints;
  } catch (error) {
    console.error("Error in issueApplicationReward:", error);
    throw error;
  }
};
