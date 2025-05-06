const db = require('../config/db_connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

exports.controller = (app, io, user_socket_connect_list) => {
  // Register new user
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password, email, phone, full_name } = req.body;

      // Check if username or email already exists
      const [existingUser] = await db.query(
        'SELECT * FROM user_detail WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existingUser.length) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const [result] = await db.query(
        `INSERT INTO user_detail 
        (username, password, email, phone, full_name, status)
        VALUES (?, ?, ?, ?, ?, 1)`,
        [username, hashedPassword, email, phone, full_name]
      );

      // Generate JWT token
      const token = jwt.sign(
        { userId: result.insertId, username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: result.insertId,
          username,
          email,
          phone,
          full_name
        }
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      // Find user
      const [users] = await db.query(
        'SELECT * FROM user_detail WHERE username = ? AND status = 1',
        [username]
      );

      if (!users.length) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.user_id, username: user.username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.user_id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          full_name: user.full_name
        }
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get user profile
  app.get('/api/users/:userId', async (req, res) => {
    try {
      const [user] = await db.query(
        'SELECT user_id, username, email, phone, full_name FROM user_detail WHERE user_id = ? AND status = 1',
        [req.params.userId]
      );

      if (!user.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user[0]);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update user profile
  app.put('/api/users/:userId', async (req, res) => {
    try {
      const { email, phone, full_name } = req.body;

      await db.query(
        'UPDATE user_detail SET email = ?, phone = ?, full_name = ? WHERE user_id = ?',
        [email, phone, full_name, req.params.userId]
      );

      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Change password
  app.put('/api/users/:userId/password', async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      // Get current user
      const [user] = await db.query(
        'SELECT password FROM user_detail WHERE user_id = ?',
        [req.params.userId]
      );

      if (!user.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user[0].password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await db.query(
        'UPDATE user_detail SET password = ? WHERE user_id = ?',
        [hashedPassword, req.params.userId]
      );

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Add delivery address
  app.post('/api/users/:userId/addresses', async (req, res) => {
    try {
      const { address, is_default } = req.body;

      if (is_default) {
        // Remove default status from other addresses
        await db.query(
          'UPDATE address_detail SET is_default = 0 WHERE user_id = ?',
          [req.params.userId]
        );
      }

      const [result] = await db.query(
        'INSERT INTO address_detail (user_id, address, is_default) VALUES (?, ?, ?)',
        [req.params.userId, address, is_default]
      );

      res.status(201).json({
        id: result.insertId,
        message: 'Address added successfully'
      });
    } catch (error) {
      console.error('Error adding address:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get user addresses
  app.get('/api/users/:userId/addresses', async (req, res) => {
    try {
      const [addresses] = await db.query(
        'SELECT * FROM address_detail WHERE user_id = ? ORDER BY is_default DESC',
        [req.params.userId]
      );

      res.json(addresses);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update address
  app.put('/api/users/:userId/addresses/:addressId', async (req, res) => {
    try {
      const { address, is_default } = req.body;

      if (is_default) {
        // Remove default status from other addresses
        await db.query(
          'UPDATE address_detail SET is_default = 0 WHERE user_id = ?',
          [req.params.userId]
        );
      }

      await db.query(
        'UPDATE address_detail SET address = ?, is_default = ? WHERE address_id = ?',
        [address, is_default, req.params.addressId]
      );

      res.json({ message: 'Address updated successfully' });
    } catch (error) {
      console.error('Error updating address:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete address
  app.delete('/api/users/:userId/addresses/:addressId', async (req, res) => {
    try {
      await db.query(
        'DELETE FROM address_detail WHERE address_id = ?',
        [req.params.addressId]
      );

      res.json({ message: 'Address deleted successfully' });
    } catch (error) {
      console.error('Error deleting address:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}; 