import { Job, Company, JobApproval, School, JobApplication } from '../models/index.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { Op } from 'sequelize';

export class JobService {
  static async createJob(data, user) {
    try {
      if (!user.companyId && user.role !== 'company_admin' && user.role !== 'admin') {
        return {
          success: false,
          statusCode: 403,
          data: { 
            error: 'Only company admins can create jobs',
            code: 'PERMISSION_DENIED'
          }
        };
      }

      const job = await Job.create({
        title: data.title,
        description: data.description,
        expiresAt: data.expiresAt || null,
        status: data.status || 'active',
        companyId: user.companyId
      });
      
      return {
        success: true,
        statusCode: 201,
        data: {
          job: {
            id: job.id,
            title: job.title,
            description: job.description,
            expiresAt: job.expiresAt,
            status: job.status,
            createdAt: job.createdAt
          }
        }
      };
    } catch (error) {
      return ErrorHandler.handleServiceError(error, data, 'JOB SERVICE');
    }
  }
  
  static async getJobs(query, user) {
    try {
      const { limit = 10, page = 1, ...rest } = query;
      const skip = (page - 1) * limit;
      
      let filter = { ...rest };
      
      // Remove empty status to prevent SQL errors
      if (filter.status === '') {
        delete filter.status;
      }
      
      // Apply role-based filtering
      console.log('User role:', user );
      if (!user) {
        filter.status = 'active';
      } else if (user.role === 'student' || user.role === 'public') {
        filter.status = 'active';
      } else if (user.role === 'company_admin' && user.companyId) {
        // Ensure companyId exists and is properly applied for company admins
        filter.companyId = user.companyId;
        console.log(`Filtering jobs for company admin with companyId: ${user.companyId}`);
      }
      
      console.log('Job filter:', JSON.stringify(filter));
      
      const jobs = await Job.findAll({
        where: filter,
        limit: parseInt(limit),
        offset: skip,
        order: [['createdAt', 'DESC']],
        include: [{ model: Company, attributes: ['id', 'name'] }]
      });
      
      return jobs;
    } catch (error) {
      console.error('[JOB SERVICE ERROR]', error);
      throw error;
    }
  }
  
  static async getJob(id, user) {
    try {
      const job = await Job.findByPk(id, {
        include: [{ model: Company, attributes: ['id', 'name'] }]
      });
      
      if (!job) {
        throw new Error(`Job with id ${id} not found`);
      }
      
      if ((!user || user.role === 'public' || user.role === 'student') && 
          job.status !== 'active') {
        throw new Error('Access to this job is restricted');
      }
      
      if (user.role === 'company_admin' && job.companyId !== user.companyId) {
        throw new Error('You do not have permission to view this job');
      }
      
      return job;
    } catch (error) {
      console.error('[JOB SERVICE ERROR]', error);
      throw error;
    }
  }
  
  static async updateJob(id, data, user) {
    try {
      const job = await Job.findByPk(id);
      
      if (!job) {
        return {
          success: false,
          statusCode: 404,
          data: { 
            error: 'Job not found',
            code: 'NOT_FOUND'
          }
        };
      }
      
      if (user.role === 'company_admin' && job.companyId !== user.companyId) {
        return {
          success: false,
          statusCode: 403,
          data: { 
            error: 'You do not have permission to update this job',
            code: 'PERMISSION_DENIED'
          }
        };
      }
      
      await job.update({
        title: data.title || job.title,
        description: data.description || job.description,
        expiresAt: data.expiresAt || job.expiresAt,
        status: data.status || job.status
      });
      
      return {
        success: true,
        statusCode: 200,
        data: { 
          job: {
            id: job.id,
            title: job.title,
            description: job.description,
            expiresAt: job.expiresAt,
            status: job.status,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt
          }
        }
      };
    } catch (error) {
      return ErrorHandler.handleServiceError(error, { id, ...data }, 'JOB SERVICE');
    }
  }
  
  static async deleteJob(id, user) {
    try {
      const job = await Job.findByPk(id);
      
      if (!job) {
        return {
          success: false,
          statusCode: 404,
          data: { 
            error: 'Job not found',
            code: 'NOT_FOUND'
          }
        };
      }
      
      if (user.role === 'company_admin' && job.companyId !== user.companyId) {
        return {
          success: false,
          statusCode: 403,
          data: { 
            error: 'You do not have permission to delete this job',
            code: 'PERMISSION_DENIED'
          }
        };
      }
      
      await job.destroy();
      
      return {
        success: true,
        statusCode: 200,
        data: { message: 'Job deleted successfully' }
      };
    } catch (error) {
      return ErrorHandler.handleServiceError(error, { id }, 'JOB SERVICE');
    }
  }
}

export const getJobs = async (query, user) => {
  try {
    const { limit = 10, page = 1, ...rest } = query;
    const skip = (page - 1) * limit;
    
    let filter = { ...rest };
    
    // For public or student users, only show approved jobs
    if (!user || user.role === 'public' || user.role === 'student') {
      filter.status = 'approved';
    }
    
    // Add additional filters based on user role if needed
    // ... existing code for role-based filtering ...
    
    const jobs = await Job.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
      
    return jobs;
  } catch (error) {
    console.error('[JOB SERVICE ERROR] Operation failed:', error);
    throw new Error('Failed to retrieve jobs');
  }
};

export const getJob = async (id, user) => {
  try {
    const job = await Job.findById(id);
    
    if (!job) {
      throw new Error(`Job with id ${id} not found`);
    }
    
    // For public or student users, only allow viewing approved jobs
    if ((!user || user.role === 'public' || user.role === 'student') && job.status !== 'approved') {
      throw new Error('Not authorized to view this job');
    }
    
    return job;
  } catch (error) {
    console.error('[JOB SERVICE ERROR] Operation failed:', error);
    throw new Error(`Failed to retrieve job with id ${id}`);
  }
};
