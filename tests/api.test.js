const request = require('supertest');
const app = require('../server'); 
const { db } = require('../database/setup'); 
const jwt = require('jsonwebtoken');

describe('Food Delivery API CRUD Tests', () => {
    
    //Tokens forthe each role
    let adminToken, ownerToken, customerToken;
    // Clear and sync database before running tests
    beforeAll(async () => {
        await db.sync({ force: true });

        // Make sure 'your_jwt_secret' matches what is in .env
        const secret = process.env.JWT_SECRET || 'your_test_secret';
        
        adminToken = jwt.sign({ id: 1, role: 'admin' }, secret);
        ownerToken = jwt.sign({ id: 2, role: 'owner' }, secret);
        customerToken = jwt.sign({ id: 3, role: 'customer' }, secret);

    });

    // Shutdown DB connection after tests finish
    afterAll(async () => {
        await db.close();
    });

    describe('Register, Login, and Logout test', () => {
        const testUser = {
            name: "Test User",
            email: "auth@test.com",
            password: "securePassword123",
            bday: "1990-01-01",
            address: "Test Lane",
            phone: "5555555",
            dcard: "123456"
        };

        //registration success
        test('POST /api/register - should create a new user', async () => {
            const response = await request(app)
                .post('/api/register')
                .send(testUser);
            expect(response.status).toBe(201);
        });

        // Return error for registration because some fields are missing
        test('POST /api/register - should return error if fields are missing', async () => {
            const response = await request(app)
                .post('/api/register')
                .send({ name: "Incomplete User" }); 
            expect(response.status).toBe(400);
            expect(response.body.error).toContain("Registration failed. All fields are required");
        });

        // Return error for registration because email already exist
        test('POST /api/register - should return error if email already exists', async () => {
            const response = await request(app)
                .post('/api/register')
                .send(testUser); 

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('User with this email already exists');
        });

        //login success
        test('POST /api/login - should return a token for valid credentials', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body.message).toBe('Login successful');
        
            // Save token for the logout test
            const userToken = response.body.token;
        });

        //Return error for log in with invalid email
        test('POST /api/login - should fail with wrong email', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    email: "wrong@email.com",
                    password: testUser.password
                });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid email');
        });

        //Return error for log in for invalid password
        test('POST /api/login - should fail with wrong password', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    email: testUser.email,
                    password: "wrongpassword"
                });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid password');
        });

        // Log out
        test('POST /api/logout - should return success message', async () => {
            const response = await request(app)
                .post('/api/logout');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Logout successful');
        });
});

    // Restaurant resource
    // POST: admin creating a restaurant
    describe('POST /api/restaurants', () => {

        // Success
        test('should create a new restaurant successfully', async () => {
            const newRestaurant = {
                name: "Miyu's Bento",
                address: "456 Osaka Way",
                food_type: "Japanese",
                phone: 987654321
            };

            const response = await request(app)
                .post('/api/restaurants')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newRestaurant);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe("Restaurant created successfully");
            expect(response.body.restaurant).toHaveProperty('restaurantID');
            expect(response.body.restaurant.name).toBe("Miyu's Bento");
        });

        // Return error: some fields are missing
        test('should return error if required fields are missing', async () => {
            const response = await request(app)
                .post('/api/restaurants')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ 
                    name: "Incomplete Restaurant",
                    address: "Missing other fields" // missing some fields
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("All fields are required: name, address, food_type, and phone.");
        });

        //Return erro bc the user is not authorized
        test('should return 401 if no token is provided', async () => {
            const response = await request(app)
                .post('/api/restaurants')
                .send({ name: "Ghost Restaurant" });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('No token provided');
        });

        //Returning error becaue the useris not admin
        test('should return 403 if an Owner tries to create a restaurant', async () => {
            const response = await request(app)
                .post('/api/restaurants')
                .set('Authorization', `Bearer ${ownerToken}`) 
                .send({
                    name: "Star Restaurant",
                    address: "789 Fake Street fake",
                    food_type: "Fast Food",
                    phone: "111222333"
                });

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Access denied. Admin role required.');
        });
    });


    // Menu resource
    // POST: creating a new menu
    describe('POST /api/menus', () => {

        // Menu successfully created
        test('should create a new menu item successfully', async () => {
            const newItem = {
                name: "Spicy Ramen",
                ingredients: "Noodles, Broth, Pork, Egg",
                description: "Traditional spicy tonkotsu ramen",
                price: 15.50,
                restaurantID: 1
            };

            const response = await request(app)
                .post('/api/menus')
                .set('Authorization', `Bearer ${ownerToken}`) 
                .send(newItem);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('menuID'); 
            expect(response.body.name).toBe("Spicy Ramen");
            expect(response.body.price).toBe(15.50);
        });

        // Return error because some fields are missing
        test('should return error if menu fields are missing', async () => {
            const response = await request(app)
                .post('/api/menus')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ 
                    name: "Incomplete Ramen",
                    price: 15.50  // missing some fields
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("All fields are required: name, ingredients, description, price, and restaurantID.");
        });

        // Returning error because the user is not authorized
        test('should return 401 if no token is provided', async () => {
            const response = await request(app)
                .post('/api/menus')
                .send({ name: "Special Star Ramen" });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('No token provided');
        });

    
        //Retun error because the user is not the Owner
        test('should return 403 if a Customer tries to create a menu item', async () => {
            const response = await request(app)
                .post('/api/menus')
                .set('Authorization', `Bearer ${customerToken}`) 
                .send({
                    name: "Special Sea Food Ramen",
                    ingredients: "Water, noodle, kelp", 
                    description: "You can enjoy the taste of  the sea!",
                    price: 11.00,
                    restaurantID: 1
                }); 

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Access denied. Owner role required.');
        });
    });

    // order resource
    // POST: users creating order
    describe('POST /api/orders', () => {

        // success
        test('should place an order successfully', async () => {
            const validOrder = {
                customerID: 1,
                menuItemIDs: [1] 
            };

            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${customerToken}`)
                .send(validOrder);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe("Order placed successfully!");
            expect(response.body).toHaveProperty('orderID');
            expect(response.body).toHaveProperty('status');
        });

        // Return error because no items were provided
        test('should return error if no items are selected', async () => {
            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ customerID: 1, menuItemIDs: [] });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("No items selected.");
        });

        // Return error because the items in the order are not coming from the same place
        test('should return error if items are from different restaurants', async () => {
            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ 
                    customerID: 1, 
                    menuItemIDs: [1, 4] 
                    // 1 comes from restaurant 1, 4 comes from restaurant 2
                });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe("One or more selected menu items do not exist.");
        });

        //Return Error because Authentication Missing 
        test('should return 401 if no token is provided', async () => {
            const response = await request(app)
                .post('/api/orders')
                .send({ customerID: 1, menuItemIDs: [1] });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe("No token provided");
        });

        //Return Error because Wrong Role (Admin trying to place a customer order)
        test('should return 403 if an Admin tries to place an order', async () => {
            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${adminToken}`) 
                .send({ customerID: 1, menuItemIDs: [1] });

            expect(response.status).toBe(403);
            expect(response.body.error).toContain("Customer role required");
    });
    });

    // Retunr error - NO token
    test('should return 401 if no token is provided to a protected route', async () => {
        const response = await request(app)
            .post('/api/restaurants')
            .send({ name: "Unprotected" });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('No token provided');
    });

    // Return error - Invalid Token
    test('should return 401 if an invalid token is provided', async () => {
        const response = await request(app)
            .post('/api/menus')
            .set('Authorization', 'Bearer invalid-token')
            .send({});

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Invalid token');
    });

    // Returning error because Admin is required
    test('should return 403 if a Customer tries to access Admin route', async () => {
        const response = await request(app)
            .post('/api/restaurants')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ 
                name: "Miyu's Bistro", 
                address: "Osaka", 
                food_type: "Sushi", 
                phone: "123" 
            });

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Access denied. Admin role required.');
    });

    // Returning error because Owner is required
    test('should return 403 if a Customer tries to create a menu', async () => {
        const response = await request(app)
            .post('/api/menus')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ name: "Sushi Platter" });

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Access denied. Owner role required.');
    });

    // No error for customer to place a new order
    test('should allow Customer to place an order', async () => {
        const response = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ 
                customerID: 102, 
                menuItemIDs: [1] 
            });

        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
    });
});
