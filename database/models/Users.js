const { Sequelize, DataTypes } = require('sequelize');

// User Model
module.exports = (sequelize, DataTypes) => {
    const Users = db.define('Users', {
        userID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        bday:{
            type: DataTypes.STRING,
            allowNull:false
        },
        address:{
            type: DataTypes.STRING,
            allowNull: false
        },
        phone: {
            type:DataTypes.INTEGER,
            allowNull: false
        },
        dcard: {
            type:DataTypes.INTEGER,
            allowNull:false
        },
        // role added
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'customer',
            validate: {isIn: [['customer', 'owner', 'admin']]}
        }
    });
      return Users;
};