const { Sequelize, DataTypes } = require('sequelize');

// restaurant Model
module.exports = (sequelize, DataTypes) => {
    const Restaurant = db.define('Restaurant', {
        restaurantID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        food_type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        phone: {
            type: DataTypes.INTERGER,
            allowNull: false,
        }
    });
      return Restaurant;
};