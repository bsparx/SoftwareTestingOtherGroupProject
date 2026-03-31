const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const userRoutes = require('./routes/userRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');

dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/emergencies', emergencyRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Hostel Maintenance API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
