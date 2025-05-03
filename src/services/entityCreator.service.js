import { School, Company } from '../models/index.js';

class BaseEntityCreator {
  async createEntity(data, transaction) {
    const entity = await this.createModel(data, transaction);
    return {
      entity,
      role: this.getRole(),
      userData: this.getUserData(entity)
    };
  }
  
  formatResponse(entity) {
    const result = {};
    result[this.getEntityType()] = {
      id: entity.id,
      name: entity.name
    };
    return result;
  }
  
  createModel() { throw new Error('Method not implemented'); }
  getRole() { throw new Error('Method not implemented'); }
  getUserData() { throw new Error('Method not implemented'); }
  getEntityType() { throw new Error('Method not implemented'); }
}

class SchoolEntityCreator extends BaseEntityCreator {
  async createModel(data, transaction) {
    return School.create({
      name: data.school.name
    }, { transaction });
  }
  
  getRole() {
    return 'school_admin';
  }
  
  getUserData(entity) {
    return { schoolId: entity.id };
  }
  
  getEntityType() {
    return 'school';
  }
}

class CompanyEntityCreator extends BaseEntityCreator {
  async createModel(data, transaction) {
    return Company.create({
      name: data.company.name
    }, { transaction });
  }
  
  getRole() {
    return 'company_admin';
  }
  
  getUserData(entity) {
    return { companyId: entity.id };
  }
  
  getEntityType() {
    return 'company';
  }
}

export class EntityCreatorService {
  static getCreator(type) {
    const creators = {
      school: new SchoolEntityCreator(),
      company: new CompanyEntityCreator()
    };
    
    const creator = creators[type];
    if (!creator) {
      throw new Error(`No entity creator found for type: ${type}`);
    }
    
    return creator;
  }
}
