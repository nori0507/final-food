const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Initialize database connection
const db = new Sequelize({
    dialect: process.env.DB_TYPE,
    storage: `database/${process.env.DB_NAME}` || 'database/finalfood.db',
    logging: false
});

// Import Models 
const Users = require('./models/Users')(db, DataTypes); // Pass both db and DataTypes
const Restaurant = require('./models/Restaurant')(db, DataTypes);
const Menu = require('./models/Menu')(db, DataTypes);
const Order = require('./models/Order')(db, DataTypes);

// Relationships
Users.hasMany(Restaurant, { foreignKey: 'ownerID' });
Restaurant.belongsTo(Users, { foreignKey: 'ownerID' });

Users.hasMany(Order, { foreignKey: 'customerID' }); 
Order.belongsTo(Users, { foreignKey: 'customerID' }); 

Restaurant.hasMany(Menu, { foreignKey: 'restaurantID', onDelete: 'CASCADE' });
Menu.belongsTo(Restaurant, { foreignKey: 'restaurantID' });

Restaurant.hasMany(Order, { foreignKey: 'restaurantID', onDelete: 'CASCADE' });
Order.belongsTo(Restaurant, { foreignKey: 'restaurantID' });

// Many-to-Many for Order Items
Order.belongsToMany(Menu, { through: 'OrderItems', foreignKey: 'orderID' });
Menu.belongsToMany(Order, { through: 'OrderItems', foreignKey: 'menuID' });


// Initialize database
async function initializeDatabase() {
    try {
        await db.authenticate();
        console.log('Database connection established successfully.');
        
        await db.sync({ force: false });
        console.log('Database synchronized successfully.');
    } catch (error) {
        console.error('Unable to connect to database:', error);
    }
}

initializeDatabase();

module.exports = {
    db,
    Users,
    Restaurant,
    Menu,
    Order
};