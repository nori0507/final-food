const { db, Users, Restaurant, Menu, Order } = require('./setup');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        // Clear existing data (Force sync)
        await db.sync({ force: true });
        console.log('Database cleared and synced.');

        const passwordHash = await bcrypt.hash('password123', 10);

        // Create Users (Admin, Owner, Customer)
        const admin = await Users.create({
            name: 'Admin Alice',
            email: 'admin@foodapp.com',
            password: passwordHash,
            bday: '1990-01-01',
            address: '123 Tech Lane',
            phone: 5550101,
            dcard: 11112222,
            role: 'admin'
        });

        const owner1 = await Users.create({
            name: 'Bob Burger',
            email: 'bob@burgers.com',
            password: passwordHash,
            bday: '1985-05-12',
            address: '456 Grill St',
            phone: 5550202,
            dcard: 33334444,
            role: 'owner'
        });

        const owner2 = await Users.create({
            name: 'Miyu Sushi',
            email: 'miyu@sushi.com',
            password: passwordHash,
            bday: '1992-03-15',
            address: '321 Rice Road',
            phone: 5550808,
            dcard: 77778888,
            role: 'owner'
        });

        const customer = await Users.create({
            name: 'Charlie Hungry',
            email: 'charlie@gmail.com',
            password: passwordHash,
            bday: '2000-10-20',
            address: '789 Apartment Ave',
            phone: 5550303,
            dcard: 55556666,
            role: 'customer'
        });

        // Create Restaurants (linked to Owners)
        const myRestaurant = await Restaurant.create({
            name: "Bob's Brilliant Burgers",
            address: "101 Patty Way",
            food_type: "American",
            phone: 5559999,
            ownerID: owner1.usersID // Linking to the owner1 we just created
        });

        const secondRestaurant = await Restaurant.create({
            name: "Miyu's Midnight Ramen",
            address: "888 Noodle Blvd",
            food_type: "Japanese",
            phone: 5557777,
            ownerID: owner2.usersID 
        });

        // Create Menu Items (linked to Restaurants)
        const item1 = await Menu.create({
            name: "Classic Cheeseburger",
            ingredients: "Beef, Cheddar, Lettuce, Tomato",
            description: "A timeless favorite.",
            price: 12,
            restaurantID: myRestaurant.restaurantID // Linking to the first restaurant that we just created
        });

        const item2 = await Menu.create({
            name: "Cajun Fries",
            ingredients: "Potatoes, Cajun Spice",
            description: "Spicy and crispy.",
            price: 5,
            restaurantID: myRestaurant.restaurantID
        });

        const item3 = await Menu.create({
            name: "Vanilla Shake",
            ingredients: "Milk, Vanilla Bean",
            description: "Creamy and cold.",
            price: 6,
            restaurantID: myRestaurant.restaurantID
        });

        const item4 = await Menu.create({ // only this one is from the second restaurant
            name: "Spicy Tonkotsu Ramen",
            ingredients: "Pork Broth, Ramen Noodles, Chashu, Egg",
            description: "Hearty and spicy noodle soup.",
            price: 16,
            restaurantID: secondRestaurant.restaurantID 
        });

        // Create an Order (Many-to-Many)
        // Create the Order record
        const myOrder = await Order.create({
            est_delivery_min: 25,
            order_status: 'preparing',
            customerID: customer.usersID,
            restaurantID: myRestaurant.restaurantID
        });

        // Connect items to the order using the Join Table (OrderItems)
        await myOrder.addMenus([item1, item2]); 

        console.log('Sample data seeded successfully!');
        process.exit();

    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();