const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const companyRoutes = require('./routes/companies');
const rentalRoutes = require('./routes/rentals');
const verificationRoutes = require('./routes/verification');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/rentals', rentalRoutes);

// Use the verification routes BEFORE app.listen
app.use('/api', verificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something broke!',
    details: err.message 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 