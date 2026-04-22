const jwt = require('jsonwebtoken');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { db, Users, Restaurant, Menu, Order } = require('./database/setup');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// adding cors package and using it as a part of the middleware
const cors = require('cors');
app.use(cors());

// Middleware
app.use(express.json());

// replacing the session middleware with JWT middleware
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = {
            id: decoded.id,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role
        };
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        } else {
            return res.status(401).json({ error: 'Token verification failed' });
        }
    }
}

// Authorization for Customer
function requireCustomer(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    if (req.user.role === 'customer') {
        next();
    } else {
        return res.status(403).json({ error: 'Access denied. Customer role required.' });
    }
}

// Authorization for Owner
function requireOwner(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    if (req.user.role === 'owner') {
        next();
    } else {
        return res.status(403).json({ error: 'Access denied. Owner role required.' });
    }
}

// Authorization for Admin
function requireAdmin(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    if (req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
}

// Test database connection
async function testConnection() {
    try {
        await db.authenticate();
        console.log('Connection to database established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

testConnection();

// GET All Restaurants
app.get('/api/restaurants', requireAuth,async (req, res) => {
    const data = await Restaurant.findAll();
    res.json(data);
});

// GET All Menus
app.get('/api/menus',requireAuth, async (req, res) => {
    const data = await Menu.findAll();
    res.json(data);
});


// POST: Registration
app.post('/api/register', async (req, res, next) => {
    try {
        const { name, email, password, bday, address, phone, dcard } = req.body;
        
        // Check if the user is missing any input values
        if (!name || !email || !password || !bday || !address || !phone || !dcard) {
            return res.status(400).json({ error: "Registration failed. All fields are required: name, email, password, bday, address, phone, and dcard."  });
        }

        // Check if the user already exists
        const existingUser = await Users.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        
        // Hashing the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Hardcode the role here
        const newUser = await Users.create({
            name,
            email,
            password: hashedPassword,
            bday,
            address,
            phone,
            dcard,
            role: 'customer' // Overrides anything the user sent, default shoud be customer accrding to Users model,but this is very important so I am just making sure
        });
        
        // Message that will pop up when the register was succedded
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.usersID,
                name: newUser.name,
                email: newUser.email, 
                role: newUser.role 
            }
        });
        
    } catch (error) { // Returning error
        next(error);
    }
});

// POST: Log in 
app.post('/api/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find the user by email
        const user = await Users.findOne({ where: { email } });
        
        // When user doesn't exist, return error
        if (!user) {
            return res.status(401).json({ error: 'Invalid email' });
        }

        // See if the password matches or not
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        // Return error when password is wrong
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }


        // JWT: We include ID and Role so the middleware can use them later
        const token = jwt.sign(
            { 
                id: user.usersID, 
                name: user.name, 
                email: user.email, 
                role: user.role 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // 5. Send the token back to the client
        res.json({ 
            message: 'Login successful', 
            token: token, 
            user: { 
                id: user.usersID, 
                name: user.name, 
                email: user.email,
                role: user.role 
            }
        });

    } catch (error) {
        next(error);
    }
});

// POST: Logout
app.post('/api/logout', (req, res) => { 
    res.json({ message: 'Logout successful' });
});

// POST: Customers create orders
app.post('/api/orders', requireAuth, requireCustomer,async (req, res, next) => {
    try {
        const { customerID, menuItemIDs } = req.body;

        // Return error if the customer selects no menu
        if (!menuItemIDs || menuItemIDs.length === 0) {
            return res.status(400).json({ error: "No items selected." });
        }

        // Fetch the Menu details for the items selected
        const items = await Menu.findAll({
            where: { menuID: menuItemIDs } 
        });

        // Compare the length - ifthey donot match, that means some menu from customer's input does not exist, the return error
        if (items.length !== menuItemIDs.length) {
            return res.status(400).json({ error: "One or more selected menu items do not exist." });
        }

        // Check every items restaurant ID (every ordered menu has to come fromt the same restaurant)
        const restaurantID = items[0].restaurantID;
        // Returns true if every single item is has the same restaurantID - otherwise return false
        const isSameRestaurant = items.every(item => item.restaurantID === restaurantID);

        // Return error if every orderd menu isnot coming from the same restaurant
        if (!isSameRestaurant) {
            return res.status(400).json({ error: "All items must be from the same restaurant." });
        }

        // Create a new order
        const newOrder = await Order.create({
            customerID,
            restaurantID
        });

        // Add menues to the order
        await newOrder.addMenus(items);

        // Success
        res.status(201).json({
            message: "Order placed successfully!",
            orderID: newOrder.orderID,
            status: newOrder.order_status
        });

    } catch (error) { // Return error if order was not created
        next(error);
    }
});

// POST: Owners create menu
app.post('/api/menus', requireAuth, requireOwner, async (req, res, next) => {
    try {
        const { name, ingredients, description, price, restaurantID } = req.body;

        // Check if any of these are missing before hitting the DB
        if (!name || !ingredients || !description || !price || !restaurantID) {
            return res.status(400).json({ error: "All fields are required: name, ingredients, description, price, and restaurantID." });
        }

        // Create the menu item
        const newMenu = await Menu.create({
            name,
            ingredients,
            description,
            price,
            restaurantID // This is the foreign key linking it to the restaurant
        });

        // Return the new menu whne succeeded
        res.status(201).json(newMenu);

    } catch (error) { // Return an error
        next(error);
    }
});

// POST: Admin creates a restaurant
app.post('/api/restaurants', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { name, address, food_type, phone } = req.body;

        // Check if any fields are missing
        if (!name || !address || !food_type || !phone) {
            return res.status(400).json({ 
                error: "All fields are required: name, address, food_type, and phone." 
            });
        }

        // Create the new restaurant
        const newRestaurant = await Restaurant.create({
            name,
            address,
            food_type,
            phone
        });

        // Successful creation of a restaurant
        res.status(201).json({
            message: "Restaurant created successfully",
            restaurant: newRestaurant
        });

    } catch (error) {// Return error when the process failed
        next(error); 
    }
});

// PUT: Users update their own profile
app.put('/api/users/:id', requireAuth, async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Check if the user exist
        const user = await Users.findByPk(id);
        if (!user) { // Return error if the user does not exist
            return res.status(404).json({ error: "User not found" });
        }

        // check if the user Id input and loggined user ID mathces
        if (parseInt(id) !== req.user.id) {
            return res.status(403).json({ error: "Forbidden: You can only update your own profile." });
        }

        // Get the data from the request body
        let dataToUpdate = { ...req.body };

        // Deleting the role field if user tries to change it
        delete dataToUpdate.role;

        // Check if any sent fields are empty strings 
        // All the field are required tobe filled, so empty field is not acceptable
        for (let key in dataToUpdate) {
            if (dataToUpdate[key] === "") {
                return res.status(400).json({ error: "Fields cannot be empty." });
            }
        }

        // When the password is changed, it has tobe hashed and the hashed one has to be stored
        if (dataToUpdate.password) {
            dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, 10);
        }

        // Execute the update
        await user.update(dataToUpdate);

        // Pop up message forthe success update
        res.json({ 
            message: "Profile updated successfully",
            user: {
                id: user.usersID,
                name: user.name,
                email: user.email,
                bday: user.bday,
                address: user.address,
                phone: user.phone
            }
        });

    } catch (error) { // Return error
       next(error);
    }
});

// PUT: Owners update their menu
app.put('/api/menus/:id', requireAuth,requireOwner,async (req, res, next) => {
    try {
        const { id } = req.params;

        // Checking is the menu exist
        const menuItem = await Menu.findByPk(id);
        if (!menuItem) {  // Return error when the menu does not exist
            return res.status(404).json({ error: "Menu not found" });
        }

        // CHeck is the owner's restaurant id and input restaurant ID matches
        const restaurant = await Restaurant.findByPk(menuItem.restaurantID); 
        const isOwner = Number(restaurant.ownerID) === Number(req.user.usersID || req.user.id);
        if (!restaurant || !isOwner) {
            return res.status(403).json({ error: "Forbidden: You do not own the restaurant for this menu item." });
        }

        // Prepare the update data from the request body
        let dataToUpdate = { ...req.body };

        // Returning error when owner sent empty fields
        for (let key in dataToUpdate) {
            if (dataToUpdate[key] === "") {
                return res.status(400).json({ error: "Fields cannot be empty." });
            }
        }

        // restairantID cannot be changed by the owner, so delete the modification if theres any
        delete dataToUpdate.restaurantId;

        // Execute the update
        await menuItem.update(dataToUpdate);

        // Successfully updated
        res.json({
            message: "Menu item updated successfully",
            updatedItem: menuItem
        });

    } catch (error) {
       next(error);
    }
});

// PUT: Owners update order(status and estimated delivery time)
app.put('/api/orders/:id', requireAuth, requireOwner, async (req, res, next) => {
    try {
        const { id } = req.params;

        // Find the order and return error if it does not exist
        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // check if the the order belongs to the restaurant that the owner owns
        const restaurant = await Restaurant.findByPk(order.restaurantID);
        const isTheRestaurantOwner = (Number(restaurant.ownerID) === Number(req.user.id));
        if (!isTheRestaurantOwner) {
            return res.status(403).json({ 
                error: "Forbidden: You do not own this restaurant." 
            });
        }

        // Extract only the fields the owner is allowed to change
        const { status, estimated_time } = req.body;

        // Return error if the input was empty("")
        if (status === "" || estimated_time === "") {
            return res.status(400).json({ error: "Status or Estimated Time cannot be empty." });
        }

        // Execute the update using only the allowed fields (ignores input for other fields)
        await order.update({ 
            status, 
            estimated_time 
        });

        // If the update succedded
        res.json({
            message: "Order status updated",
            order: order
        });

    } catch (error) { //Return error
        next(error);
    }
});

// PUT: Owners update restaurant
app.put('/api/restaurants/:id', requireAuth,requireOwner,async (req, res, next) => {
    try {
        const { id } = req.params;

        // Find the restaurant and return error if there is none
        const restaurant = await Restaurant.findByPk(id);
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        // check if the user is the owner of this restaurant or not
        if (restaurant.ownerId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Forbidden: You do not own this restaurant." });
        }

        const dataToUpdate = { ...req.body };

        // Validation: Ensure no fields are being set to an empty string
        for (let key in dataToUpdate) {
            if (dataToUpdate[key] === "") {
                return res.status(400).json({ error: "Fields cannotbe empty"});
            }
        }

        // Execute the update
        await restaurant.update(dataToUpdate);

        // Tell the user that the restaurant info is updated
        res.json({
            message: "Restaurant updated successfully",
            restaurant: restaurant
        });

    } catch (error) { // Return error 
        next(error);
    }
});


// DELETE: Admin delete a user
app.delete('/api/users/:id', requireAuth,requireAdmin,async (req, res, next) => {
    try {
        //deleting a user according to the iput ID
        const deletedRowsCount = await Users.destroy({
            where: { usersID: req.params.id }
        });
        
        // Return erro when the user does not exist
        if (deletedRowsCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Success
        res.json({ message: 'User deleted successfully' });
    } catch (error) { // Return error when delete didnot happen
        next(error);
    }
});

// DELETE: Admin delete a restaurant
app.delete('/api/restaurants/:id',requireAuth,requireAdmin, async (req, res, next) => {
    try {
        // Deleting a restaurant according tothe input ID
        const deletedRowsCount = await Restaurant.destroy({
            where: { restaurantID: req.params.id }
        });
        
        // Return error when the resutaurant does not exist
        if (deletedRowsCount === 0) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        
        // Success
        res.json({ message: 'Restaurant deleted successfully' });
    } catch (error) { // Return error when delete didnot happnen
        next(error);
    }
});

// DELETE: Owners deleting menu
app.delete('/api/menus/:id',requireAuth,requireOwner, async (req, res, next) => {
    try {
        const { id } = req.params;
        // Find the item so menuItem is defined and we can check its restaurant
        const menuItem = await Menu.findByPk(id);

        // return error when menu was not found
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        // Check if the owner is the owner for the restaurant that the menu belongs to
        const restaurant = await Restaurant.findByPk(menuItem.restaurantID);
        if (!restaurant || (Number(restaurant.ownerID) !== Number(req.user.id))) {
            return res.status(403).json({ error: "Forbidden: You do not own the restaurant this menu belongs to." });
        }

        await menuItem.destroy();
        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) { // Return error when the delete did not happens
       next(error);
    }
});

// Middleware for uexpected errors
app.use((err, req, res, next) => {
  // Highlight error
  console.error(err.stack);
  // Send a respond to the user
  res.status(500).json({ error: "Unexpected Error Occured: Action Failed", message: err.message });
  
});

// exproting module so that we can ue the function in different files
module.exports = app;

// Start the surver
if (process.env.NODE_ENV !== 'test') {
    app.listen(3000, () => console.log('MVP running at http://localhost:3000'));
}
