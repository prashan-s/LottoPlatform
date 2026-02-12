const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Member = require('./Member');

const Profile = sequelize.define('Profile', {
  profileId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'profile_id',
  },
  memberId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Member,
      key: 'memberId',
    },
    field: 'member_id',
  },
  firstName: {
    type: DataTypes.STRING(100),
    field: 'first_name',
  },
  lastName: {
    type: DataTypes.STRING(100),
    field: 'last_name',
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  phoneNumber: {
    type: DataTypes.STRING(50),
    field: 'phone_number',
  },
  preferences: {
    type: DataTypes.JSON,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at',
  },
}, {
  tableName: 'profiles',
  timestamps: true,
  underscored: true,
});

// Define association
Profile.belongsTo(Member, { foreignKey: 'memberId' });
Member.hasOne(Profile, { foreignKey: 'memberId' });

module.exports = Profile;