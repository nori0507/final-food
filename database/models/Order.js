const { Sequelize, DataTypes } = require('sequelize');

// Order Model
module.exports = (sequelize, DataTypes) => {
    const Order = db.define('Order', {
        orderID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },  
        est_delivery_min: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 30
        },
        order_status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'preparing',
            validate: {isIn: [['preparing', 'shipping','delivered']]}
        }
    });
      return Order;
};
