const { Sequelize, DataTypes } = require('sequelize');

// Menu Model
module.exports = (sequelize, DataTypes) => {
    const Menu = sequelize.define('Menu', {
        menuID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        ingredients: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false
        },
        price: {
            type:DataTypes.INTEGER,
            allowNull:false
        },
    });
      return Menu;
};