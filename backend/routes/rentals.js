const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Test endpoint to check database connection and table structure
router.get('/test-db', async function(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'velorent'
    });

    // Check if bookings table exists and show its structure
    const [tables] = await connection.execute("SHOW TABLES LIKE 'bookings'");
    if (tables.length === 0) {
      return res.status(500).json({ error: 'Bookings table does not exist' });
    }

    const [columns] = await connection.execute("DESCRIBE bookings");
    res.json({ 
      message: 'Database connection successful',
      bookingsTableExists: true,
      columns: columns
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      error: 'Database connection failed',
      details: error.message 
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Get user's rentals
router.get('/my-rentals', auth.verifyToken, async function(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'velorent'
    });

    const [rentals] = await connection.execute(
      `SELECT r.*, v.name as vehicle_name, v.imageUrl as vehicle_image, c.name as company_name 
       FROM rentals r 
       LEFT JOIN vehicles v ON r.vehicleId = v.id 
       LEFT JOIN rental_companies c ON r.companyId = c.id 
       WHERE r.userId = ? 
       ORDER BY r.createdAt DESC`,
      [req.user.id]
    );

    res.json(rentals);
  } catch (error) {
    console.error('Error fetching rentals:', error);
    res.status(500).json({ 
      error: 'Failed to fetch rentals',
      details: error.message 
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Get rental by ID
router.get('/my-rentals/:id', auth.verifyToken, async function(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'velorent'
    });

    const [rentals] = await connection.execute(
      `SELECT r.*, v.name as vehicle_name, v.image_path as vehicle_image, c.name as company_name 
       FROM rentals r 
       LEFT JOIN vehicles v ON r.vehicleId = v.id 
       LEFT JOIN rental_companies c ON r.companyId = c.id 
       WHERE r.id = ? AND r.userId = ?`,
      [req.params.id, req.user.id]
    );

    if (rentals.length === 0) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    res.json(rentals[0]);
  } catch (error) {
    console.error('Error fetching rental:', error);
    res.status(500).json({ 
      error: 'Failed to fetch rental',
      details: error.message 
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Create new rental and booking with file uploads
router.post('/', auth.verifyToken, upload.fields([
  { name: 'validId', maxCount: 1 },
  { name: 'additionalId', maxCount: 1 }
]), async function(req, res) {
  console.log('=== BOOKING REQUEST DEBUG ===');
  console.log('User:', req.user);
  console.log('Body:', req.body);
  console.log('Files:', req.files);
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'velorent'
    });

    // Get fields from req.body (multer parses them as strings)
    const {
      fullName, mobileNumber, serviceType, rentFromDate, rentToDate, rentTime, destination, occasion, message, vehicleId, vehicleName,
      totalCost, downPayment, remainingAmount, paymentMethod
    } = req.body;

    // Validate required fields
    if (!fullName || !mobileNumber || !serviceType || !rentFromDate || !rentToDate || !rentTime || !destination) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for existing pending, approved, or active bookings for this user
    const [existingBookings] = await connection.execute(
      `SELECT id FROM bookings WHERE user_id = ? AND (status = 'Pending' OR status = 'Approved' OR status = 'Active') LIMIT 1`,
      [req.user.id]
    );
    if (existingBookings.length > 0) {
      return res.status(400).json({ error: 'You already have a pending, approved, or ongoing booking. Please complete or cancel it before making a new booking.' });
    }

    // Get file paths from req.files
    const validIdPath = req.files['validId'] ? req.files['validId'][0].path : null;
    const additionalIdPath = req.files['additionalId'] ? req.files['additionalId'][0].path : null;

    // Get vehicle name and company_id if not provided
    let vehicle_name = vehicleName;
    let company_id = null;
    let company_name = null;
    if (vehicleId) {
      const [vehicles] = await connection.execute('SELECT name, company_id FROM vehicles WHERE id = ?', [vehicleId]);
      if (vehicles.length > 0) {
        vehicle_name = vehicle_name || vehicles[0].name;
        company_id = vehicles[0].company_id;
        if (company_id) {
          const [companies] = await connection.execute('SELECT name FROM companies WHERE id = ?', [company_id]);
          if (companies.length > 0) {
            company_name = companies[0].name;
          }
        }
      }
    }

    // Insert into bookings table (now with user_id, start_date, end_date, company_id, company_name, and payment info)
    await connection.execute(
      `INSERT INTO bookings (
        user_id, user_name, mobile_number, vehicle_id, company_id, company_name, vehicle_name, service_type, start_date, end_date, rent_time, destination, occasion, message, valid_id_path, additional_id_path, total_cost, down_payment, remaining_payment, payment_method, booking_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        req.user.id,
        fullName,
        mobileNumber,
        vehicleId,
        company_id,
        company_name,
        vehicle_name || '',
        serviceType,
        rentFromDate,
        rentToDate,
        rentTime,
        destination,
        occasion || null,
        message || null,
        validIdPath,
        additionalIdPath,
        totalCost || 0,
        downPayment || 0,
        remainingAmount || 0,
        paymentMethod || null,
        new Date(),
        'Pending'
      ]
    );

    res.status(201).json({ message: 'Booking created' });
  } catch (error) {
    console.error('=== BOOKING ERROR DEBUG ===');
    console.error('Error creating booking:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create booking',
      details: error.message,
      stack: error.stack
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Cancel rental
router.post('/:id/cancel', auth.verifyToken, async function(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'velorent'
    });

    const [result] = await connection.execute(
      `UPDATE rentals 
       SET status = 'cancelled' 
       WHERE id = ? AND userId = ? AND status = 'pending'`,
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Rental not found or cannot be cancelled' });
    }

    res.json({ message: 'Rental cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling rental:', error);
    res.status(500).json({ 
      error: 'Failed to cancel rental',
      details: error.message 
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Add booking to bookings table
router.post('/bookings', async function(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'velorent'
    });

    const {
      user_name,
      mobile_number,
      vehicle_name,
      service_type,
      rent_date,
      rent_time,
      destination,
      occasion,
      message,
      valid_id_path,
      additional_id_path,
      booking_date,
      status
    } = req.body;

    if (!user_name || !mobile_number || !vehicle_name || !service_type || !rent_date || !rent_time || !destination || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await connection.execute(
      `INSERT INTO bookings (
        user_name, mobile_number, vehicle_name, service_type, rent_date, rent_time, destination, occasion, message, valid_id_path, additional_id_path, booking_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        user_name,
        mobile_number,
        vehicle_name,
        service_type,
        rent_date,
        rent_time,
        destination,
        occasion || null,
        message || null,
        valid_id_path || null,
        additional_id_path || null,
        booking_date || new Date(),
        status
      ]
    );
    res.status(201).json({ message: 'Booking created' });
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Get all bookings for the current user (by user_id)
router.get('/my-bookings', auth.verifyToken, async function(req, res) {
  let connection;
  try {
    console.log('=== MY-BOOKINGS DEBUG ===');
    console.log('User ID from token:', req.user.id);
    console.log('User object:', req.user);
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'velorent'
    });

    // First check if bookings table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'bookings'");
    console.log('Bookings table exists:', tables.length > 0);
    
    if (tables.length === 0) {
      return res.status(500).json({ 
        error: 'Bookings table does not exist',
        details: 'The bookings table has not been created in the database'
      });
    }

    // Check table structure
    const [columns] = await connection.execute("DESCRIBE bookings");
    console.log('Bookings table columns:', columns);

    const [bookings] = await connection.execute(
      `SELECT * FROM bookings WHERE user_id = ? ORDER BY booking_date DESC`,
      [req.user.id]
    );

    console.log('Found bookings:', bookings.length);
    console.log('Bookings data:', bookings);

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bookings',
      details: error.message,
      stack: error.stack
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Test endpoint to check authentication (requires auth)
router.get('/test-auth', auth.verifyToken, async function(req, res) {
  try {
    console.log('=== AUTH TEST ===');
    console.log('User from token:', req.user);
    res.json({
      message: 'Authentication successful',
      user: req.user
    });
  } catch (error) {
    console.error('Auth test error:', error);
    res.status(500).json({ 
      error: 'Auth test failed',
      details: error.message
    });
  }
});

// Test endpoint to check database connection (no auth required)
router.get('/test-db', async function(req, res) {
  let connection;
  try {
    console.log('=== DATABASE TEST ===');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'velorent'
    });

    // Check if database exists
    const [databases] = await connection.execute("SHOW DATABASES LIKE 'velorent'");
    console.log('Database exists:', databases.length > 0);

    // Check tables
    const [tables] = await connection.execute("SHOW TABLES");
    console.log('Available tables:', tables);

    // Check if bookings table exists
    const [bookingsTable] = await connection.execute("SHOW TABLES LIKE 'bookings'");
    console.log('Bookings table exists:', bookingsTable.length > 0);

    if (bookingsTable.length > 0) {
      const [columns] = await connection.execute("DESCRIBE bookings");
      console.log('Bookings table structure:', columns);
    }

    res.json({
      databaseExists: databases.length > 0,
      tables: tables,
      bookingsTableExists: bookingsTable.length > 0,
      message: 'Database test completed'
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      error: 'Database test failed',
      details: error.message,
      stack: error.stack
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

module.exports = router; 