const memberService = require('../services/memberService');
const profileService = require('../services/profileService');
const createMemberSchema = require('../dto/CreateMemberRequest');
const updateProfileSchema = require('../dto/UpdateProfileRequest');
const Joi = require('joi');

const emailQuerySchema = Joi.object({ email: Joi.string().email().required() });

async function createMember(req, res, next) {
  try {
    const { error, value } = createMemberSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const member = await memberService.createMember(value);
    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
}

async function getMemberById(req, res, next) {
  try {
    const { memberId } = req.params;
    const member = await memberService.getMemberById(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.status(200).json(member);
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { memberId } = req.params;
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const profile = await profileService.updateProfile(memberId, value);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
}

async function getProfileByMemberId(req, res, next) {
  try {
    const { memberId } = req.params;
    const profile = await profileService.getProfileByMemberId(memberId);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found for this member' });
    }
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
}

async function getMemberByEmail(req, res, next) {
  try {
    const { error, value } = emailQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const member = await memberService.getMemberByEmail(value.email);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.status(200).json(member);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createMember,
  getMemberById,
  getMemberByEmail,
  updateProfile,
  getProfileByMemberId,
};