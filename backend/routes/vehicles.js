const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Get all vehicles
router.get('/', async (req, res) => {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'velorent'
    });

    // Check if vehicles table has data
    console.log('Checking vehicles table...');
    const [vehicleCount] = await connection.execute(`
      SELECT COUNT(*) as count FROM vehicles
    `);

    console.log('Vehicle count:', vehicleCount[0].count);

    // If no vehicles exist, insert sample data using the actual table structure
    if (vehicleCount[0].count === 0) {
      console.log('No vehicles found. Inserting sample data...');
      
      // Insert sample vehicles using the actual table structure from your database
      await connection.execute(`
        INSERT INTO vehicles (name, type, price_with_driver, price_without_driver, Owner, image_path, company_id)
        VALUES 
        ('Toyota Camry 2023', 'Sedan', 3500.00, 2500.00, 'U-Drive', 'assets/images/vehicle-placeholder.svg', 14),
        ('Honda CR-V 2022', 'SUV', 4500.00, 3500.00, 'U-Drive', 'assets/images/vehicle-placeholder.svg', 14),
        ('Ford Ranger 2023', 'Pickup', 5000.00, 4000.00, 'U-Drive', 'assets/images/vehicle-placeholder.svg', 14),
        ('Toyota Hiace 2022', 'Van', 4000.00, 3000.00, 'U-Drive', 'assets/images/vehicle-placeholder.svg', 14),
        ('Nissan Navara 2023', 'Pickup', 4800.00, 3800.00, 'U-Drive', 'assets/images/vehicle-placeholder.svg', 14),
        ('Mitsubishi Montero 2022', 'SUV', 4200.00, 3200.00, 'U-Drive', 'assets/images/vehicle-placeholder.svg', 14),
        ('Honda City 2023', 'Sedan', 2800.00, 2000.00, 'U-Drive', 'assets/images/vehicle-placeholder.svg', 14),
        ('Toyota Innova 2022', 'Van', 3800.00, 2800.00, 'U-Drive', 'assets/images/vehicle-placeholder.svg', 14),
        ('Hyundai Starex 2023', 'Van', 4500.00, 3500.00, 'U-Drive', 'assets/images/vehicle-placeholder.svg', 14),
        ('Mazda CX-5 2022', 'SUV', 4000.00, 3000.00, 'U-Drive', 'assets/images/vehicle-placeholder.svg', 14)
      `);
      
      console.log('Sample vehicles inserted successfully');
    }

    // Fetch vehicles with company information
    console.log('Fetching vehicles...');
    const [vehicles] = await connection.execute(`
      SELECT 
        v.id,
        v.name,
        v.type,
        v.price_with_driver,
        v.price_without_driver,
        v.Owner,
        v.image_path,
        v.company_id,
        c.company_name
      FROM vehicles v
      LEFT JOIN companies c ON v.company_id = c.id
      WHERE c.status = 'approved' OR c.status IS NULL
      ORDER BY v.id
    `);

    console.log('Raw vehicles fetched:', vehicles.length);
    
    // Transform the data to match the frontend expectations
    const transformedVehicles = vehicles.map(vehicle => ({
      id: vehicle.id,
      name: vehicle.name,
      type: vehicle.type,
      price_with_driver: vehicle.price_with_driver,
      price_without_driver: vehicle.price_without_driver,
      imageUrl: vehicle.image_path || 'assets/images/vehicle-placeholder.svg',
      company_id: vehicle.company_id,
      company_name: vehicle.company_name || vehicle.Owner,
      rating: 4.5, // Default rating
      capacity: vehicle.type === 'Van' ? '12' : vehicle.type === 'SUV' ? '7' : '5',
      color: ['White', 'Black', 'Silver', 'Blue', 'Red'][Math.floor(Math.random() * 5)],
      mileage: Math.floor(Math.random() * 50000) + 10000
    }));

    console.log('Transformed vehicles:', transformedVehicles.length);
    res.json(transformedVehicles);

  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vehicles: ' + error.message,
      details: error.stack
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Get vehicle by ID
router.get('/:id', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'velorent'
    });

    const [vehicles] = await connection.execute(`
      SELECT 
        v.id,
        v.name,
        v.type,
        v.price_with_driver,
        v.price_without_driver,
        v.Owner,
        v.image_path,
        v.company_id,
        c.company_name
      FROM vehicles v
      LEFT JOIN companies c ON v.company_id = c.id
      WHERE v.id = ?
    `, [req.params.id]);

    if (vehicles.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const vehicle = vehicles[0];
    const transformedVehicle = {
      id: vehicle.id,
      name: vehicle.name,
      type: vehicle.type,
      price_with_driver: vehicle.price_with_driver,
      price_without_driver: vehicle.price_without_driver,
      imageUrl: vehicle.image_path || 'assets/images/vehicle-placeholder.svg',
      company_id: vehicle.company_id,
      company_name: vehicle.company_name || vehicle.Owner,
      rating: 4.5,
      capacity: vehicle.type === 'Van' ? '12' : vehicle.type === 'SUV' ? '7' : '5',
      color: ['White', 'Black', 'Silver', 'Blue', 'Red'][Math.floor(Math.random() * 5)],
      mileage: Math.floor(Math.random() * 50000) + 10000
    };

    res.json(transformedVehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vehicle',
      details: error.message 
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

module.exports = router;