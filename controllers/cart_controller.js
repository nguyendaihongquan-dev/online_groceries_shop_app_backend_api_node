const db = require('../config/db_connection');
const { validationResult } = require('express-validator');

exports.controller = (app, io, user_socket_connect_list) => {
  // Get user's cart
  app.get('/api/cart/:userId', async (req, res) => {
    try {
      const [cart] = await db.query(`
        SELECT c.*, p.name, p.price, p.unit_name, p.unit_value,
        GROUP_CONCAT(i.image) as images
        FROM cart_detail c
        JOIN product_detail p ON c.prod_id = p.prod_id
        LEFT JOIN image_detail i ON p.prod_id = i.prod_id
        WHERE c.user_id = ? AND c.status = 1
        GROUP BY c.cart_id
      `, [req.params.userId]);

      res.json(cart);
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Add item to cart
  app.post('/api/cart', async (req, res) => {
    try {
      const { user_id, prod_id, quantity } = req.body;

      // Check if product exists and is in stock
      const [product] = await db.query(
        'SELECT * FROM product_detail WHERE prod_id = ? AND status = 1',
        [prod_id]
      );

      if (!product.length) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check if item already exists in cart
      const [existingItem] = await db.query(
        'SELECT * FROM cart_detail WHERE user_id = ? AND prod_id = ? AND status = 1',
        [user_id, prod_id]
      );

      if (existingItem.length) {
        // Update quantity if item exists
        await db.query(
          'UPDATE cart_detail SET quantity = quantity + ? WHERE cart_id = ?',
          [quantity, existingItem[0].cart_id]
        );
        return res.json({ message: 'Cart updated successfully' });
      }

      // Add new item to cart
      const [result] = await db.query(
        'INSERT INTO cart_detail (user_id, prod_id, quantity) VALUES (?, ?, ?)',
        [user_id, prod_id, quantity]
      );

      res.status(201).json({ id: result.insertId, message: 'Item added to cart' });
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update cart item quantity
  app.put('/api/cart/:cartId', async (req, res) => {
    try {
      const { quantity } = req.body;
      await db.query(
        'UPDATE cart_detail SET quantity = ? WHERE cart_id = ?',
        [quantity, req.params.cartId]
      );
      res.json({ message: 'Cart updated successfully' });
    } catch (error) {
      console.error('Error updating cart:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Remove item from cart
  app.delete('/api/cart/:cartId', async (req, res) => {
    try {
      await db.query(
        'UPDATE cart_detail SET status = 2 WHERE cart_id = ?',
        [req.params.cartId]
      );
      res.json({ message: 'Item removed from cart' });
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Checkout
  app.post('/api/cart/checkout', async (req, res) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const { user_id, address, payment_method, cart_ids } = req.body;

      // Get cart items
      const [cartItems] = await connection.query(`
        SELECT c.*, p.price
        FROM cart_detail c
        JOIN product_detail p ON c.prod_id = p.prod_id
        WHERE c.cart_id IN (?) AND c.status = 1
      `, [cart_ids]);

      if (!cartItems.length) {
        throw new Error('No items in cart');
      }

      // Calculate total
      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Create order
      const [orderResult] = await connection.query(
        `INSERT INTO order_detail 
        (user_id, total, address, payment_method, cart_id, status)
        VALUES (?, ?, ?, ?, ?, 1)`,
        [user_id, total, address, payment_method, cart_ids.join(',')]
      );

      // Update cart items status
      await connection.query(
        'UPDATE cart_detail SET status = 2 WHERE cart_id IN (?)',
        [cart_ids]
      );

      await connection.commit();

      // Notify user about order status
      if (user_socket_connect_list[user_id]) {
        io.to(user_socket_connect_list[user_id]).emit('order_status', {
          orderId: orderResult.insertId,
          status: 'pending',
          message: 'Your order has been placed successfully'
        });
      }

      res.status(201).json({
        orderId: orderResult.insertId,
        message: 'Order placed successfully'
      });
    } catch (error) {
      await connection.rollback();
      console.error('Error during checkout:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      connection.release();
    }
  });

  // Get order history
  app.get('/api/orders/:userId', async (req, res) => {
    try {
      const [orders] = await db.query(`
        SELECT o.*, 
        GROUP_CONCAT(
          JSON_OBJECT(
            'cart_id', c.cart_id,
            'prod_id', c.prod_id,
            'quantity', c.quantity,
            'product_name', p.name,
            'product_price', p.price
          )
        ) as items
        FROM order_detail o
        JOIN cart_detail c ON FIND_IN_SET(c.cart_id, o.cart_id)
        JOIN product_detail p ON c.prod_id = p.prod_id
        WHERE o.user_id = ?
        GROUP BY o.order_id
        ORDER BY o.created_date DESC
      `, [req.params.userId]);

      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}; 