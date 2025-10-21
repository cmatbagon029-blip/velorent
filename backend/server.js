const express = require('express');
const cors = require('cors');
const path = require('path');
const vehiclesRouter = require('./routes/vehicles');
const companiesRouter = require('./routes/companies');
const authRouter = require('./routes/auth');
const rentalsRouter = require('./routes/rentals');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/rentals', rentalsRouter);

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
