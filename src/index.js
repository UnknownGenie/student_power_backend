import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { router as apiRoutes } from './routes/api.js';
import db from './config/database.js';
import models from './models/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await db.authenticate();
    console.log('Database connected...');
    
    // models.loadModels() is no longer needed as models are loaded on import
    
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(morgan('dev'));
    
    app.use('/api', apiRoutes);
    
    app.get('/', (req, res) => {
      res.json({ message: 'Welcome to Student Power API' });
    });
    
    app.use((err, req, res, next) => {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        status: 'error',
        statusCode,
        message: err.message
      });
    });
    
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

startServer();
