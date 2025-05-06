const db = require('../config/db_connection');
const { validationResult } = require('express-validator');

exports.controller = (app, io, user_socket_connect_list) => {
  // Get all products with filters
  app.get('/api/products', async (req, res) => {
    try {
      const { category, type, search, sort, page = 1, limit = 10 } = req.query;
      let query = `
        SELECT p.*, c.cat_name, t.type_name, b.brand_name,
        GROUP_CONCAT(i.image) as images,
        GROUP_CONCAT(n.nutrition_name, ':', n.nutrition_value) as nutrition_info
        FROM product_detail p
        LEFT JOIN category_detail c ON p.cat_id = c.cat_id
        LEFT JOIN type_detail t ON p.type_id = t.type_id
        LEFT JOIN brand_detail b ON p.brand_id = b.brand_id
        LEFT JOIN image_detail i ON p.prod_id = i.prod_id
        LEFT JOIN nutrition_detail n ON p.prod_id = n.prod_id
        WHERE p.status = 1
      `;

      const params = [];
      if (category) {
        query += ' AND p.cat_id = ?';
        params.push(category);
      }
      if (type) {
        query += ' AND p.type_id = ?';
        params.push(type);
      }
      if (search) {
        query += ' AND (p.name LIKE ? OR p.detail LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ' GROUP BY p.prod_id';

      if (sort) {
        switch (sort) {
          case 'price_asc':
            query += ' ORDER BY p.price ASC';
            break;
          case 'price_desc':
            query += ' ORDER BY p.price DESC';
            break;
          case 'name_asc':
            query += ' ORDER BY p.name ASC';
            break;
          case 'name_desc':
            query += ' ORDER BY p.name DESC';
            break;
          default:
            query += ' ORDER BY p.created_date DESC';
        }
      } else {
        query += ' ORDER BY p.created_date DESC';
      }

      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const [products] = await db.query(query, params);
      
      // Get total count for pagination
      const [countResult] = await db.query(
        'SELECT COUNT(*) as total FROM product_detail WHERE status = 1',
        []
      );
      const total = countResult[0].total;

      res.json({
        products,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get product by ID
  app.get('/api/products/:id', async (req, res) => {
    try {
      const [product] = await db.query(`
        SELECT p.*, c.cat_name, t.type_name, b.brand_name,
        GROUP_CONCAT(i.image) as images,
        GROUP_CONCAT(n.nutrition_name, ':', n.nutrition_value) as nutrition_info
        FROM product_detail p
        LEFT JOIN category_detail c ON p.cat_id = c.cat_id
        LEFT JOIN type_detail t ON p.type_id = t.type_id
        LEFT JOIN brand_detail b ON p.brand_id = b.brand_id
        LEFT JOIN image_detail i ON p.prod_id = i.prod_id
        LEFT JOIN nutrition_detail n ON p.prod_id = n.prod_id
        WHERE p.prod_id = ? AND p.status = 1
        GROUP BY p.prod_id
      `, [req.params.id]);

      if (!product.length) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product[0]);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create new product
  app.post('/api/products', async (req, res) => {
    try {
      const {
        cat_id,
        brand_id,
        type_id,
        name,
        detail,
        unit_name,
        unit_value,
        nutrition_weight,
        price,
        images,
        nutrition_info
      } = req.body;

      // Start transaction
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Insert product
        const [result] = await connection.query(
          `INSERT INTO product_detail 
          (cat_id, brand_id, type_id, name, detail, unit_name, unit_value, nutrition_weight, price)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [cat_id, brand_id, type_id, name, detail, unit_name, unit_value, nutrition_weight, price]
        );

        const productId = result.insertId;

        // Insert images
        if (images && images.length) {
          const imageValues = images.map(image => [productId, image]);
          await connection.query(
            'INSERT INTO image_detail (prod_id, image) VALUES ?',
            [imageValues]
          );
        }

        // Insert nutrition info
        if (nutrition_info && nutrition_info.length) {
          const nutritionValues = nutrition_info.map(({ name, value }) => [productId, name, value]);
          await connection.query(
            'INSERT INTO nutrition_detail (prod_id, nutrition_name, nutrition_value) VALUES ?',
            [nutritionValues]
          );
        }

        await connection.commit();
        res.status(201).json({ id: productId, message: 'Product created successfully' });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update product
  app.put('/api/products/:id', async (req, res) => {
    try {
      const {
        cat_id,
        brand_id,
        type_id,
        name,
        detail,
        unit_name,
        unit_value,
        nutrition_weight,
        price,
        images,
        nutrition_info
      } = req.body;

      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Update product
        await connection.query(
          `UPDATE product_detail SET 
          cat_id = ?, brand_id = ?, type_id = ?, name = ?, detail = ?,
          unit_name = ?, unit_value = ?, nutrition_weight = ?, price = ?
          WHERE prod_id = ?`,
          [cat_id, brand_id, type_id, name, detail, unit_name, unit_value, nutrition_weight, price, req.params.id]
        );

        // Update images
        if (images) {
          await connection.query('DELETE FROM image_detail WHERE prod_id = ?', [req.params.id]);
          if (images.length) {
            const imageValues = images.map(image => [req.params.id, image]);
            await connection.query(
              'INSERT INTO image_detail (prod_id, image) VALUES ?',
              [imageValues]
            );
          }
        }

        // Update nutrition info
        if (nutrition_info) {
          await connection.query('DELETE FROM nutrition_detail WHERE prod_id = ?', [req.params.id]);
          if (nutrition_info.length) {
            const nutritionValues = nutrition_info.map(({ name, value }) => [req.params.id, name, value]);
            await connection.query(
              'INSERT INTO nutrition_detail (prod_id, nutrition_name, nutrition_value) VALUES ?',
              [nutritionValues]
            );
          }
        }

        await connection.commit();
        res.json({ message: 'Product updated successfully' });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete product (soft delete)
  app.delete('/api/products/:id', async (req, res) => {
    try {
      await db.query(
        'UPDATE product_detail SET status = 2 WHERE prod_id = ?',
        [req.params.id]
      );
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get product recommendations
  app.get('/api/products/recommendations/:userId', async (req, res) => {
    try {
      // Get user's order history
      const [orderHistory] = await db.query(`
        SELECT p.type_id, p.cat_id, COUNT(*) as purchase_count
        FROM order_detail o
        JOIN cart_detail c ON FIND_IN_SET(c.cart_id, o.cart_id)
        JOIN product_detail p ON c.prod_id = p.prod_id
        WHERE o.user_id = ? AND o.status = 1
        GROUP BY p.type_id, p.cat_id
        ORDER BY purchase_count DESC
        LIMIT 5
      `, [req.params.userId]);

      if (!orderHistory.length) {
        // If no order history, return best selling products
        const [bestSellers] = await db.query(`
          SELECT p.*, COUNT(c.cart_id) as order_count
          FROM product_detail p
          JOIN cart_detail c ON p.prod_id = c.prod_id
          JOIN order_detail o ON FIND_IN_SET(c.cart_id, o.cart_id)
          WHERE p.status = 1
          GROUP BY p.prod_id
          ORDER BY order_count DESC
          LIMIT 10
        `);
        return res.json(bestSellers);
      }

      // Get recommended products based on user's purchase history
      const typeIds = orderHistory.map(item => item.type_id);
      const catIds = orderHistory.map(item => item.cat_id);

      const [recommendations] = await db.query(`
        SELECT DISTINCT p.*
        FROM product_detail p
        WHERE p.status = 1
        AND (p.type_id IN (?) OR p.cat_id IN (?))
        AND p.prod_id NOT IN (
          SELECT c.prod_id
          FROM cart_detail c
          JOIN order_detail o ON FIND_IN_SET(c.cart_id, o.cart_id)
          WHERE o.user_id = ?
        )
        LIMIT 10
      `, [typeIds, catIds, req.params.userId]);

      res.json(recommendations);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}; 