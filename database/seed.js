const { db, Users, Restaurant, Menu, Order } = require('./setup');

const seedDatabase = async () => {
    try {
        // Clear existing data (Force sync)
        await db.sync({ force: true });
        console.log('Database cleared and synced.');

        // Create Users (Admin, Owner, Customer)
        const admin = await Users.create({
            name: 'Admin Alice',
            email: 'admin@foodapp.com',
            password: 'hashed_password_123', // In a real app, hash this!
            bday: '1990-01-01',
            address: '123 Tech Lane',
            phone: 5550101,
            dcard: 11112222,
            role: 'admin'
        });

        const owner = await Users.create({
            name: 'Bob Burger',
            email: 'bob@burgers.com',
            password: 'hashed_password_123',
            bday: '1985-05-12',
            address: '456 Grill St',
            phone: 5550202,
            dcard: 33334444,
            role: 'owner'
        });

        const customer = await Users.create({
            name: 'Charlie Hungry',
            email: 'charlie@gmail.com',
            password: 'hashed_password_123',
            bday: '2000-10-20',
            address: '789 Apartment Ave',
            phone: 5550303,
            dcard: 55556666,
            role: 'customer'
        });

        // Create a Restaurant (Linked to Owner)
        const myRestaurant = await Restaurant.create({
            name: "Bob's Brilliant Burgers",
            address: "101 Patty Way",
            food_type: "American",
            phone: 5559999,
            ownerId: owner.userID // Linking to the owner we just created
        });

        // Create Menu Items (Linked to Restaurant)
        const item1 = await Menu.create({
            name: "Classic Cheeseburger",
            ingredients: "Beef, Cheddar, Lettuce, Tomato",
            description: "A timeless favorite.",
            price: 12,
            restaurantId: myRestaurant.restaurantId
        });

        const item2 = await Menu.create({
            name: "Cajun Fries",
            ingredients: "Potatoes, Cajun Spice",
            description: "Spicy and crispy.",
            price: 5,
            restaurantId: myRestaurant.restaurantId
        });

        const item3 = await Menu.create({
            name: "Vanilla Shake",
            ingredients: "Milk, Vanilla Bean",
            description: "Creamy and cold.",
            price: 6,
            restaurantId: myRestaurant.restaurantId
        });

        // Create an Order (Many-to-Many)
        // Create the Order record
        const myOrder = await Order.create({
            est_delivery_min: 25,
            order_status: 'preparing',
            customerId: customer.userID,
            restaurantId: myRestaurant.restaurantId
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