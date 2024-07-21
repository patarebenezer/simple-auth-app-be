'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
 class UserSession extends Model {
  static associate(models) {
   // Define associations here
   UserSession.belongsTo(models.User, { foreignKey: 'userId' });
  }
 }

 UserSession.init({
  userId: DataTypes.INTEGER,
  loginAt: DataTypes.DATE,
  logoutAt: DataTypes.DATE,
 }, {
  sequelize,
  modelName: 'UserSession',
 });

 return UserSession;
};