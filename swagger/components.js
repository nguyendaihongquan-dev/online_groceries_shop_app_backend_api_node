/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           description: HTTP status code
 *           example: 400
 *         message:
 *           type: string
 *           description: Error message
 *           example: Invalid input data
 *
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: User ID
 *           example: 1
 *         name:
 *           type: string
 *           description: User name
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           description: User email
 *           example: john@example.com
 *         phone:
 *           type: string
 *           description: User phone number
 *           example: "+1234567890"
 *         role:
 *           type: string
 *           description: User role
 *           enum: [user, admin]
 *           example: user
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: User creation timestamp
 *
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Product ID
 *           example: 1
 *         name:
 *           type: string
 *           description: Product name
 *           example: Organic Apple
 *         description:
 *           type: string
 *           description: Product description
 *           example: Fresh organic apples from local farms
 *         price:
 *           type: number
 *           format: float
 *           description: Product price
 *           example: 1.99
 *         category_id:
 *           type: integer
 *           description: Category ID
 *           example: 2
 *         image:
 *           type: string
 *           description: Product image URL
 *           example: "/images/products/apple.jpg"
 *         quantity:
 *           type: integer
 *           description: Available quantity
 *           example: 100
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Product creation timestamp
 *
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Category ID
 *           example: 1
 *         name:
 *           type: string
 *           description: Category name
 *           example: Fruits
 *         description:
 *           type: string
 *           description: Category description
 *           example: Fresh fruits from organic farms
 *         image:
 *           type: string
 *           description: Category image URL
 *           example: "/images/categories/fruits.jpg"
 *
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Order ID
 *           example: 1
 *         user_id:
 *           type: integer
 *           description: User ID
 *           example: 3
 *         total:
 *           type: number
 *           format: float
 *           description: Order total amount
 *           example: 45.99
 *         status:
 *           type: string
 *           description: Order status
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *           example: processing
 *         delivery_address:
 *           type: string
 *           description: Delivery address
 *           example: "123 Main St, Anytown, AN 12345"
 *         payment_method:
 *           type: string
 *           description: Payment method
 *           enum: [credit_card, paypal, cod]
 *           example: credit_card
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Order creation timestamp
 *
 *   responses:
 *     UnauthorizedError:
 *       description: Access token is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *
 *     BadRequest:
 *       description: Invalid input data
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *
 *     NotFound:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *
 *   parameters:
 *     IdParam:
 *       name: id
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *       description: Resource ID
 */ 