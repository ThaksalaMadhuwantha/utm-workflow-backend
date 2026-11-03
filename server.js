import express from 'express';
import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

console.log("Loaded GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Key is present ✅" : "Key is MISSING ❌");

import cors from 'cors';
import dns from "node:dns";
dns.setServers(["1.1.1.1","8.8.8.8"]); // Set DNS servers to Cloudflare and Google

import connectDB from './config/db.js';
import orderRoutes from './routes/orderRoutes.js';

// Connect to MongoDB Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/orders', orderRoutes);

// Test Route
app.get('/', (req, res) => {
    res.send('UTM Workflow Backend API is running successfully with ES Modules!');
});

// Port configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});