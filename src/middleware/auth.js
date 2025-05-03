import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
        code: 'NO_TOKEN'
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await User.findByPk(decoded.id);
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      code: 'SERVER_ERROR'
    });
  }
};
