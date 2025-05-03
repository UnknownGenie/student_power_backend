import { School, User, Company } from '../models/index.js';

class BaseSignupValidator {
  async validate(data) {
    const errors = {};
    
    if (!this.validateOrganizationData(data, errors) || 
        !this.validateUserData(data.user, errors)) {
      return { isValid: false, errors };
    }
    
    return { isValid: true };
  }
  
  validateUserData(user, errors) {
    if (!user) {
      errors.user = 'User data is required';
      return false;
    }
    
    if (!user.name) {
      errors.name = 'Name is required';
      return false;
    }
    
    if (!user.email) {
      errors.email = 'Email is required';
      return false;
    }
    
    if (!user.password) {
      errors.password = 'Password is required';
      return false;
    }
    
    return true;
  }
  
  validateOrganizationData() { throw new Error('Method not implemented'); }
}

class SchoolSignupValidator extends BaseSignupValidator {
  validateOrganizationData(data, errors) {
    if (!data.school) {
      errors.school = 'School data is required';
      return false;
    }
    
    if (!data.school.name) {
      errors.schoolName = 'School name is required';
      return false;
    }
    
    return true;
  }
}

class CompanySignupValidator extends BaseSignupValidator {
  validateOrganizationData(data, errors) {
    if (!data.company) {
      errors.company = 'Company data is required';
      return false;
    }
    
    if (!data.company.name) {
      errors.companyName = 'Company name is required';
      return false;
    }
    
    return true;
  }
}

export class SignupValidatorFactory {
  static createValidator(type) {
    const validators = {
      school: new SchoolSignupValidator(),
      company: new CompanySignupValidator()
    };
    
    const validator = validators[type];
    if (!validator) {
      throw new Error(`No validator found for type: ${type}`);
    }
    
    return validator;
  }
}
