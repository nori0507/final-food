const request = require('supertest');
const app = require('./server'); 
const { db } = require('./database/setup'); 

describe('Food Delivery API CRUD Tests', () => {
    
    // Clear and sync database before running tests
    beforeAll(async () => {
        await db.sync({ force: true });
    });

    // Shutdown DB connection after tests finish
    afterAll(async () => {
        await db.close();
    });

    // Users resource
    // POST: registration
    describe('POST /api/register', () => {
        // Return success
        test('should register a new user successfully', async () => {
            const newUser = {
                name: "Miyu",
                email: "miyu@test.com",
                password: "password123",
                bday: "1995-01-01",
                address: "123 Japan St",
                phone: "123456789",
                dcard: "987654321"
            };

            const response = await request(app)
                .post('/api/register')
                .send(newUser);

            expect(response.status).toBe(201);
            expect(response.body.user).toHaveProperty('email', 'miyu@test.com');
        });

        // Return error for empty field input
        test('should return error if fields are missing', async () => {
            const response = await request(app)
                .post('/api/register')
                .send({ name: "Incomplete" }); // missing some fields that are required 

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });


        // Return error: theuser already exist
        test('should return error if the user email already exists', async () => {
            const duplicateUser = {
                name: "Miyu Clone",
                email: "miyu@test.com", // This email was already registered in the first test!(Success one)
                password: "differentpassword",
                bday: "1995-01-01",
                address: "456 Other St",
                phone: "000000000",
                dcard: "000000000"
            };

            const response = await request(app)
                .post('/api/register')
                .send(duplicateUser);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('User with this email already exists');
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
                .send({ 
                    name: "Incomplete Restaurant",
                    address: "Missing other fields" // missing some fields
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Missing some fields");
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
                restaurantID: 2
            };

            const response = await request(app)
                .post('/api/menus')
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
                .send({ 
                    name: "Incomplete Ramen",
                    price: 15.50 
                    // Missing some fields
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Some fields are missing");
        });
    });

    

    // order resource
    // POST: users creating order
    describe('POST /api/orders', () => {

        // Should succeed
        test('should place an order successfully', async () => {
            const validOrder = {
                customerID: 1,
                menuItemIDs: [1] 
            };

            const response = await request(app)
                .post('/api/orders')
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
                .send({ customerID: 1, menuItemIDs: [] });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("No items selected.");
        });

        // Return error because the items in the order are not coming from the same place
        test('should return error if items are from different restaurants', async () => {
            const response = await request(app)
                .post('/api/orders')
                .send({ 
                    customerID: 1, 
                    menuItemIDs: [1, 4] 
                    // 1 comes from restaurant 1, 4 comes from restaurant 2
                });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe("All items that you order must be from the same restaurant.");
        });
    });

});