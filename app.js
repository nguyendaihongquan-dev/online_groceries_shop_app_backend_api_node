const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Import controllers
const productController = require('./controllers/product_controller');
const cartController = require('./controllers/cart_controller');
const userController = require('./controllers/user_controller');
const adminController = require('./controllers/admin_controller');

// Import middleware
const { verifyToken, isAdmin, isOwner, validateRequest, rateLimiter, requestLogger, errorHandler } = require('./middleware/auth');
const validation = require('./middleware/validation');

// Socket.IO connection handling
const user_socket_connect_list = {};

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('user_connect', (userId) => {
    user_socket_connect_list[userId] = socket.id;
    console.log(`User ${userId} connected with socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    const userId = Object.keys(user_socket_connect_list).find(
      key => user_socket_connect_list[key] === socket.id
    );
    if (userId) {
      delete user_socket_connect_list[userId];
      console.log(`User ${userId} disconnected`);
    }
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(rateLimiter);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Public routes
app.post('/api/auth/register', validateRequest(validation.registerSchema), userController.controller);
app.post('/api/auth/login', validateRequest(validation.loginSchema), userController.controller);

// Protected routes
app.use(verifyToken);

// User routes
app.get('/api/users/:userId', isOwner, userController.controller);
app.put('/api/users/:userId', isOwner, validateRequest(validation.updateProfileSchema), userController.controller);
app.put('/api/users/:userId/password', isOwner, validateRequest(validation.changePasswordSchema), userController.controller);

// Address routes
app.post('/api/users/:userId/addresses', isOwner, validateRequest(validation.addressSchema), userController.controller);
app.get('/api/users/:userId/addresses', isOwner, userController.controller);
app.put('/api/users/:userId/addresses/:addressId', isOwner, validateRequest(validation.addressSchema), userController.controller);
app.delete('/api/users/:userId/addresses/:addressId', isOwner, userController.controller);

// Product routes
app.get('/api/products', productController.controller);
app.get('/api/products/:id', productController.controller);
app.get('/api/products/recommendations/:userId', isOwner, productController.controller);

// Cart routes
app.get('/api/cart/:userId', isOwner, cartController.controller);
app.post('/api/cart', validateRequest(validation.addToCartSchema), cartController.controller);
app.put('/api/cart/:cartId', validateRequest(validation.updateCartSchema), cartController.controller);
app.delete('/api/cart/:cartId', cartController.controller);
app.post('/api/cart/checkout', validateRequest(validation.checkoutSchema), cartController.controller);

// Order routes
app.get('/api/orders/:userId', isOwner, cartController.controller);

// Admin routes
app.use('/api/admin', isAdmin);

// Admin product routes
app.post('/api/admin/products', validateRequest(validation.productSchema), productController.controller);
app.put('/api/admin/products/:id', validateRequest(validation.productSchema), productController.controller);
app.delete('/api/admin/products/:id', productController.controller);

// Admin order routes
app.get('/api/admin/orders', adminController.controller);
app.put('/api/admin/orders/:orderId/status', validateRequest(validation.updateOrderStatusSchema), adminController.controller);

// Admin user routes
app.get('/api/admin/users', adminController.controller);
app.put('/api/admin/users/:userId/status', validateRequest(validation.updateUserStatusSchema), adminController.controller);

// Admin dashboard routes
app.get('/api/admin/dashboard', adminController.controller);
app.get('/api/admin/reports/sales', adminController.controller);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
