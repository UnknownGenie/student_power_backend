import { User, School, Company } from '../models/index.js';
import { SignupValidatorFactory } from '../validators/signupValidator.js';
import db from '../config/database.js';
import { EntityCreatorService } from './entityCreator.service.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import bcrypt from 'bcryptjs';

export class AuthService {
  static async signup(data) {
    const { type = 'school' } = data;
    const transaction = await db.transaction();
    
    try {
      const validator = SignupValidatorFactory.createValidator(type);
      const validationResult = await validator.validate(data);
      
      if (!validationResult.isValid) {
        return {
          success: false,
          statusCode: 400,
          data: { error: validationResult.errors }
        };
      }
      
      const entityCreator = EntityCreatorService.getCreator(type);
      const { entity, role, userData } = await entityCreator.createEntity(data, transaction);
      
      const user = await this.createUser({
        ...data.user,
        role,
        role_in_organization: 'staff',
        ...userData
      }, transaction);
      
      await transaction.commit();
      
      const token = user.getSignedJwtToken();
      const responseData = this.formatResponseData(user, entity, type);
      
      return {
        success: true,
        statusCode: 201,
        data: {
          token,
          data: responseData
        }
      };
    } catch (error) {
      await transaction.rollback();
      console.error(`Signup Error [${type}]:`, error);
      return ErrorHandler.handleServiceError(error, data, 'AUTH SERVICE');
    }
  }
  
  static async createUser(userData, transaction) {
    return User.create({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      role_in_organization: userData.role_in_organization,
      ...(userData.schoolId && { schoolId: userData.schoolId }),
      ...(userData.companyId && { companyId: userData.companyId })
    }, { transaction });
  }
  
  static formatResponseData(user, entity, type) {
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    const entityCreator = EntityCreatorService.getCreator(type);
    const entityData = entityCreator.formatResponse(entity);
    
    return {
      user: userData,
      ...entityData
    };
  }

  static async signin(data) {
    try {
      const { email, password } = data;
      
      if (!email || !password) {
        return {
          success: false,
          statusCode: 400,
          data: { 
            error: 'Please provide email and password',
            code: 'MISSING_CREDENTIALS'
          }
        };
      }
      
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        return {
          success: false,
          statusCode: 401,
          data: { 
            error: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS'
          }
        };
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return {
          success: false,
          statusCode: 401,
          data: { 
            error: 'Invalid credentials', 
            code: 'INVALID_CREDENTIALS'
          }
        };
      }
      
      const token = user.getSignedJwtToken();
      
      let entity = null;
      let type = null;
      
      if (user.schoolId) {
        type = 'school';
        entity = await School.findByPk(user.schoolId);
      } else if (user.companyId) {
        type = 'company';
        entity = await Company.findByPk(user.companyId);
      }
      
      const responseData = this.formatResponseData(user, entity, type);
      
      return {
        success: true,
        statusCode: 200,
        data: {
          token,
          data: responseData
        }
      };
    } catch (error) {
      return ErrorHandler.handleServiceError(error, data, 'AUTH SERVICE');
    }
  }

  static async getMe(user) {
    try {
      let entity = null;
      let type = null;
      
      if (user.schoolId) {
        type = 'school';
        entity = await School.findByPk(user.schoolId);
      } else if (user.companyId) {
        type = 'company';
        entity = await Company.findByPk(user.companyId);
      }
      
      const responseData = this.formatResponseData(user, entity, type);
      
      return {
        success: true,
        statusCode: 200,
        data: responseData
      };
    } catch (error) {
      return ErrorHandler.handleServiceError(error, { userId: user.id }, 'AUTH SERVICE');
    }
  }
}
