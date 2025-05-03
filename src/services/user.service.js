import { User } from '../models/index.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import db from '../config/database.js';

export class UserService {
  static async createUser(data, admin) {
    const transaction = await db.transaction();
    
    try {
      const { name, email, password, role = 'user' } = data;
      
      if (!name || !email || !password) {
        return {
          success: false,
          statusCode: 400,
          data: { 
            error: 'Please provide name, email and password',
            code: 'MISSING_FIELDS'
          }
        };
      }
      
      if (!this.canCreateRole(admin.role, role)) {
        return {
          success: false,
          statusCode: 403,
          data: { 
            error: `You don't have permission to create a user with role: ${role}`,
            code: 'PERMISSION_DENIED'
          }
        };
      }
      
      const userData = {
        name,
        email,
        password,
        role,
        role_in_organization: data.role_in_organization || 'staff'
      };
      
      // Assign to organization based on admin's organization
      if (admin.schoolId && (admin.role === 'school_admin' || admin.role === 'admin')) {
        userData.schoolId = admin.schoolId;
      } else if (admin.companyId && (admin.role === 'company_admin' || admin.role === 'admin')) {
        userData.companyId = admin.companyId;
      }
      
      const user = await User.create(userData, { transaction });
      
      await transaction.commit();
      
      return {
        success: true,
        statusCode: 201,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }
      };
    } catch (error) {
      await transaction.rollback();
      return ErrorHandler.handleServiceError(error, data, 'USER SERVICE');
    }
  }
  
  static async getUsers(admin) {
    try {
      let whereClause = {};
      
      // Filter users by organization
      if (admin.role === 'school_admin') {
        whereClause.schoolId = admin.schoolId;
      } else if (admin.role === 'company_admin') {
        whereClause.companyId = admin.companyId;
      } else if (admin.role !== 'admin') {
        return {
          success: false,
          statusCode: 403,
          data: { 
            error: 'You don\'t have permission to view users',
            code: 'PERMISSION_DENIED'
          }
        };
      }
      
      const users = await User.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'email', 'role', 'role_in_organization', 'createdAt']
      });
      
      return {
        success: true,
        statusCode: 200,
        data: { users }
      };
    } catch (error) {
      return ErrorHandler.handleServiceError(error, {}, 'USER SERVICE');
    }
  }
  
  static canCreateRole(adminRole, userRole) {
    const allowedRoles = {
      admin: ['admin', 'school_admin', 'company_admin', 'user'],
      school_admin: ['user'],
      company_admin: ['user']
    };
    
    return allowedRoles[adminRole]?.includes(userRole) || false;
  }
}
