const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Initialize database connection
const db = new Sequelize({
    dialect: process.env.DB_TYPE,
    storage: `database/${process.env.DB_NAME}` || 'database/company_projects.db',
    logging: false
});

// Import Models 
const Users = require('./models/Users')(db, DataTypes); // Pass both db and DataTypes
const Restaurant = require('./models/Restaurant')(db, DataTypes);
const Menu = require('./models/Menu')(db, DataTypes);
const Order = require('./models/Order')(db, DataTypes);

// Relationships
Users.hasMany(Restaurant, { foreignKey: 'ownerId' });
Restaurant.belongsTo(Users, { foreignKey: 'ownerId' });

Users.hasMany(Order, { foreignKey: 'customerId' }); 
Order.belongsTo(Users, { foreignKey: 'customerId' }); 

Restaurant.hasMany(Menu, { foreignKey: 'restaurantId', onDelete: 'CASCADE' });
Menu.belongsTo(Restaurant, { foreignKey: 'restaurantId' });

Restaurant.hasMany(Order, { foreignKey: 'restaurantId' });
Order.belongsTo(Restaurant, { foreignKey: 'restaurantId' });

// Many-to-Many for Order Items
Order.belongsToMany(Menu, { through: 'OrderItems', foreignKey: 'orderId' });
Menu.belongsToMany(Order, { through: 'OrderItems', foreignKey: 'menuId' });


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