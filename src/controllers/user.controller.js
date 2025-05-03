import { UserService } from '../services/user.service.js';

export const createUser = async (req, res) => {
  const result = await UserService.createUser(req.body, req.user);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
};

export const getUsers = async (req, res) => {
  const result = await UserService.getUsers(req.user);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
};
