import { School, User, Company } from '../models/index.js';
import { SignupValidatorFactory } from '../validators/signupValidator.js';
import db from '../config/database.js';
import { AuthService } from '../services/auth.service.js';

export const signup = async (req, res) => {
  // Detect the entity type from request body
  let type = 'student';
  if (req.body.company) {
    type = 'company';
  } else if (req.body.school) {
    type = 'school';
  }
  
  const data = { ...req.body, type };
  
  const result = await AuthService.signup(data);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
};

export const signin = async (req, res) => {
  const result = await AuthService.signin(req.body);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
};

export const getMe = async (req, res) => {
  const result = await AuthService.getMe(req.user);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
};
