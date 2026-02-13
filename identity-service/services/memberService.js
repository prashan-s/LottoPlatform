const Member = require('../models/Member');
const Profile = require('../models/Profile');
const sequelize = require('../config/database');

async function createMember(memberData) {
  const transaction = await sequelize.transaction();
  try {
    const member = await Member.create({
      membershipTier: memberData.membershipTier,
    }, { transaction });

    await Profile.create({
      memberId: member.memberId,
      firstName: memberData.firstName,
      lastName: memberData.lastName,
      email: memberData.email,
      phoneNumber: memberData.phoneNumber,
      preferences: memberData.preferences,
    }, { transaction });

    await transaction.commit();
    return member;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function getMemberById(memberId) {
  return Member.findByPk(memberId, {
    include: [{ model: Profile }],
  });
}

async function getMemberByEmail(email) {
  const profile = await Profile.findOne({ where: { email } });
  if (!profile) return null;
  return Member.findByPk(profile.memberId, {
    include: [{ model: Profile }],
  });
}

module.exports = {
  createMember,
  getMemberById,
  getMemberByEmail,
};