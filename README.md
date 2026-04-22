# final-food
final project for backend development course

## Project description and purpose
I will build a restaurant and food ordering REST API. By using this API, customers can search for restaurants, view menus, and order food for delivery. In this way, people can order food without visiting restaurants, and this could save them a lot of time. Moreover, they can compare varieties of restaurants and choose the best one for themselves. My goal is to create a REST API that is like a simple version of Uber Eats and DoorDash. This API can be used by customers, owners, and admins. Some characteristics that are different from the real application such as Uber Eats are the followings: No real payments (just mock), Simplified status onlyfor delivery status, and No real-time updates. I'm interested in this project because I love eating and want to work on a food and restaurant management project. 
This project will store several types of data. The first one is Users, where information about the user is stored, including user ID, birthdate, address, name, phone number, password, debit card number, and email. It also has labels "customer," "owner," and "admin." In this way, we can create authorization based on their roles. The second one is Restaurant, where information about the restaurant is stored; the information can be owner ID (links to the Users table), restaurant ID, restaurant name, address, types of food it serves, and phone number. The third one is Menu, where information about the menu is stored: menu ID, restaurant ID (links to the Restaurant table), name, ingredients, description, and price. The fourth one is Order, where information about the order is stored, including the order ID, restaurant ID (links to the Restaurant table), customer ID (links to the Customers table), menu ID (links to the Menu table), the order status, and estimated delivery times. 


## Technologies used
This project is built with a modern backend stack:
* **Node.js** - The JavaScript runtime environment.
* **Express.js** - Web framework for building the REST API routes.
* **Sequelize (ORM)** - Used to manage the MySQL database using JavaScript objects.
* **JSONWebToken (JWT)** - Handles secure user authentication and login sessions.
* **Bcrypt** - Used for hashing and securing user passwords.
* **Dotenv** - Manages environment variables (like DB credentials) securely.
* **Postman** - Used for API testing and documentation.

## Setup and deployment instructions
### Setup
To set up and run this on local, you have to put these on  your terminal

```
npm install
npm run setup
npm run seed
npm install bcryptjs express-session
npm install jsonwebtoken
npm start
```

for testing,you will do the following before starting the environment
```
npm install --save-dev jest
npm test
```

once you run these, you will be in the server environment

### Deployment
* Going to the Render Homepage
* From your Render dashboard, click "New" and select "Web Service"
* Once you select the repository that you want to deploy, you should configure the following setting exactly:
    * **Name**: blog-api-demo (or another preferred name)
    * **Environment**: Node
    * **Region**: Select the region picked for you
    * **Branch**: main
    * **Root Directory**: Leave blank
    * **Build Command**: npm install && npm run setup && npm run seed
    * **Start Command**: npm start
* Once you have configured the settings, you need to pick your instance type. 
* Set Environment Variables
    * **NODE_ENV**: production
    * **DB_TYPE**: sqlite
    * **JWT_SECRET**: your-secure-jwt-secret-key
    * **JWT_EXPIRES_IN**: 24h
    * **DB_NAME**: models.db
    * **PORT**: 3000
    * **NODE_VERSION**: 18
* Click Deploy Web Service.
* Look for a "Your service is live" message. 


## API endpoint documentation
### Main end points with explanation
* **GET /api/restaurants and GET /menus** - available to all users
* **GET /api/users/:id and GET /orders/:id** - accessible only to the owner and customers who are related to the ID.
* **POST /api/register and POST /auth/login** - for user registration and login
* **POST /api/orders** - customers create orders
* **POST /api/menus** - owners create menu
* **POST/apo/restaurants** - admin create the restaurant
* **PUT /api/users/:id** - users update their own profile
* **PUT /api/restaurants/:id** and **PUT /menus/:id** - owners update their restaurant or menu.
* **PUT /api/orders/:id** - owners can update the order status.
* **DELETE /api/(users or restaurants)/:id** - only admin can delete these data
* **DELETE /api/menus/:id** - only owners can delete ther menus

### Postman Documentation
[Click here for Postman Docs for MVP](https://documenter.getpostman.com/view/52110882/2sBXqFNhc1)

## Authentication guide
There are three main user roles in this API. Every user can see the restaurants and menu. Customer can place orders, and update their own account information. Owners can manage their own restaurant information, including updating restaurant details and modifying menu items. They can also update the order status such as whether it is in the process ofr preparing or already delivered. Admins can create restaurants, and delete users and restaurants.

## Future improvements or stretch goals
I would say splitting endpoints into different files, because the server.js file has a long code. One of my peers suggested to do so, but I could not figure ou how to manage it. So I will need to learn skills for it. 