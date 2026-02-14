const Profile = require('../models/Profile');
const sequelize = require('../config/database');

async function getProfileByMemberId(memberId) {
  return Profile.findOne({ where: { memberId } });
}

async function updateProfile(memberId, profileData) {
  const transaction = await sequelize.transaction();
  try {
    const profile = await Profile.findOne({ where: { memberId }, transaction });

    if (!profile) {
      throw new Error('Profile not found');
    }

    profile.firstName = profileData.firstName || profile.firstName;
    profile.lastName = profileData.lastName || profile.lastName;
    profile.email = profileData.email || profile.email;
    profile.phoneNumber = profileData.phoneNumber || profile.phoneNumber;
    profile.preferences = profileData.preferences || profile.preferences;

    await profile.save({ transaction });
    await transaction.commit();
    return profile;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  getProfileByMemberId,
  updateProfile,
};