const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database'); 
const router = express.Router();

router.post('/register', async (req, res) => {
  let connection;
  try {
    console.log('Registration request received:', req.body);
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      console.log('Missing required fields:', { name: !!name, email: !!email, password: !!password });
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password length
    if (password.length < 6) {
      console.log('Password too short');
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    try {
      // Get a connection from the pool
      connection = await db.getConnection();
      console.log('Got database connection');

      // Check if user exists
      const [existing] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        console.log('User already exists:', email);
        return res.status(400).json({ 
          success: false,
          message: 'Email already registered' 
        });
      }

      // Hash password
      console.log('Hashing password...');
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      console.log('Inserting new user...');
      const [result] = await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, 'user']
      );

      console.log('User registered successfully:', { id: result.insertId, email });
      res.status(201).json({ 
        success: true,
        message: 'User registered successfully' 
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
          success: false,
          message: 'Database table not found. Please contact administrator.'
        });
      }
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
      if (dbError.code === 'ER_ACCESS_DENIED_ERROR') {
        return res.status(500).json({
          success: false,
          message: 'Database access denied. Please contact administrator.'
        });
      }
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(500).json({
          success: false,
          message: 'Database connection refused. Please try again later.'
        });
      }
      throw dbError; // Re-throw other database errors
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed: ' + error.message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

router.post('/login', async (req, res) => {
  let connection;
  try {
    console.log('Login request received:', { email: req.body.email });
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      console.log('Missing required fields:', { email: !!email, password: !!password });
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Get a connection from the pool
    connection = await db.getConnection();
    console.log('Got database connection');

    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      console.log('User not found:', email);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    const user = users[0];
    console.log('User found, verifying password...');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    console.log('Password verified, generating token...');
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      'your-secret-key',
      { expiresIn: '1h' }
    );

    console.log('Login successful for user:', email);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});


module.exports = router;