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
      const { limit = 10, page = 1, schoolId, ...rest } = query;
      const skip = (page - 1) * limit;
      
      let filter = { ...rest };
      
      if (filter.status === '') {
        delete filter.status;
      }
      
      console.log('User role:', user);
      if (!user) {
        filter.status = 'active';
      } else if (user.role === 'user' || user.role === 'public') {
        filter.status = 'active';
      } else if (user.role === 'company_admin' && user.companyId) {
        filter.companyId = user.companyId;
        console.log(`Filtering jobs for company admin with companyId: ${user.companyId}`);
      } else if (user.role === 'school_admin' && user.schoolId) {
        // For school admins, we need to handle this differently since jobs don't have schoolId
        // This is likely the source of the error
        // Instead we might need to join to JobApprovals or handle this via a separate query
        console.log(`School admin access with schoolId: ${user.schoolId}`);
        // Removing any schoolId filter as it's not a column in the jobs table
      }
      
      console.log('Job filter:', JSON.stringify(filter));
      
      const jobs = await Job.findAll({
        where: filter,
        limit: parseInt(limit),
        offset: skip,
        order: [['createdAt', 'DESC']],
        include: [{ model: Company, attributes: ['id', 'name'] }]
      });
      
      // If user role is 'user', check if the user has applied for each job
      if (user && user.role === 'user') {
        const jobIds = jobs.map(job => job.id);
        
        const applications = await JobApplication.findAll({
          where: {
            jobId: { [Op.in]: jobIds },
            userId: user.id
          },
          attributes: ['jobId']
        });
        
        const appliedJobIds = applications.map(app => app.jobId);
        
        // Add hasApplied flag to each job
        return jobs.map(job => {
          const jobData = job.toJSON();
          jobData.hasApplied = appliedJobIds.includes(job.id);
          return jobData;
        });
      }
      
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
      
      // If user role is 'user', check if they have applied for this job
      if (user && user.role === 'user') {
        const application = await JobApplication.findOne({
          where: {
            jobId: id,
            userId: user.id
          }
        });
        
        const jobData = job.toJSON();
        jobData.hasApplied = !!application;
        return jobData;
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
