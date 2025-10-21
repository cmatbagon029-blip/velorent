const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Get all rental companies
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

    console.log('Fetching companies...');
    const [rows] = await connection.execute(`
      SELECT * FROM companies 
      WHERE status = 'approved'
      ORDER BY company_name
    `);
    
    // Transform image paths to full URLs and match frontend expectations
    const companies = rows.map(company => ({
      id: company.id,
      name: company.company_name,
      email: company.contact_email,
      contactNumber: company.contact_phone,
      address: company.address,
      contactPerson: company.contact_person,
      location: company.address, // Use address as location
      logoUrl: company.company_logo || company.image_path || 'assets/images/company-placeholder.svg',
      rating: 4.5, // Default rating
      description: `Professional vehicle rental services by ${company.company_name}`
    }));

    console.log('Companies fetched successfully:', companies.length);
    res.json(companies);
  } catch (error) {
    console.error('Error in /api/companies:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch companies',
      details: error.message,
      stack: error.stack
    });
  } finally {
    if (connection) {
      console.log('Closing database connection...');
      await connection.end();
    }
  }
});

// Get company rules by company ID
router.get('/:id/rules', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'velorent'
    });

    console.log('Fetching company rules for company ID:', req.params.id);
    
    const [rows] = await connection.execute(
      'SELECT rules_data FROM company_rules WHERE company_id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.json({ rules: [] });
    }

    // Parse the JSON rules_data
    let rules = [];
    try {
      rules = JSON.parse(rows[0].rules_data);
    } catch (parseError) {
      console.error('Error parsing rules_data:', parseError);
      return res.json({ rules: [] });
    }

    console.log('Company rules fetched successfully:', rules.length);
    res.json({ rules });
  } catch (error) {
    console.error('Error fetching company rules:', error);
    res.status(500).json({ 
      error: 'Failed to fetch company rules',
      details: error.message 
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Get company by ID
router.get('/:id', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'velorent'
    });

    const [rows] = await connection.execute(
      'SELECT * FROM companies WHERE id = ? AND status = "approved"',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = {
      id: rows[0].id,
      name: rows[0].company_name,
      email: rows[0].contact_email,
      contactNumber: rows[0].contact_phone,
      address: rows[0].address,
      contactPerson: rows[0].contact_person,
      location: rows[0].address,
      logoUrl: rows[0].company_logo || rows[0].image_path || 'assets/images/company-placeholder.svg',
      rating: 4.5,
      description: `Professional vehicle rental services by ${rows[0].company_name}`
    };

    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ 
      error: 'Failed to fetch company',
      details: error.message 
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

module.exports = router; 