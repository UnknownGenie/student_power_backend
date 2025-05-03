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
  
  static async getJobs(user, query = {}) {
    try {
      const whereClause = {};
      const includeModels = [
        {
          model: Company,
          attributes: ['id', 'name']
        }
      ];
      
      // Add job applications if user role is 'user'
      let userApplications = [];
      if (user.role === 'user') {
        userApplications = await JobApplication.findAll({
          where: { userId: user.id },
          attributes: ['jobId']
        });
      }
      
      if (query.status) {
        whereClause.status = query.status;
      }
      
      let approvalRequired = false;
      
      if (user.role === 'school_admin') {
        const approvalInclude = {
          model: JobApproval,
          as: 'approvals',
          required: false,
          where: { schoolId: user.schoolId }
        };
        
        if (query.approvedBySchool === 'true') {
          approvalInclude.where.status = 'approved';
          approvalInclude.required = true;
        }
        
        includeModels.push(approvalInclude);
      } else if (user.role === 'company_admin') {
        whereClause.companyId = user.companyId;
        
        if (query.approvedBySchool === 'true') {
          includeModels.push({
            model: JobApproval,
            as: 'approvals',
            required: true,
            where: { status: 'approved' }
          });
        }
      } else if (user.role === 'user') {
        whereClause.status = 'active';
        
        if (user.schoolId) {
          includeModels.push({
            model: JobApproval,
            as: 'approvals',
            required: true,
            where: { 
              schoolId: user.schoolId,
              status: 'approved'
            }
          });
        }
      }
      
      const page = parseInt(query.page, 10) || 1;
      const limit = parseInt(query.limit, 10) || 10;
      const offset = (page - 1) * limit;
      
      const { count, rows } = await Job.findAndCountAll({
        where: whereClause,
        include: includeModels,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        distinct: true
      });
      
      const jobs = rows.map(job => {
        const baseJob = {
          id: job.id,
          title: job.title,
          description: job.description,
          expiresAt: job.expiresAt,
          status: job.status,
          company: job.Company,
          createdAt: job.createdAt,
          approvalCount: job.approvalCount,
          applicationCount: job.applicationCount,
          isApproved: job.isApproved
        };
        
        // Add isApplied flag for users
        if (user.role === 'user') {
          baseJob.isApplied = userApplications.some(app => app.jobId === job.id);
        }
        
        if (user.role === 'school_admin' && job.approvals && job.approvals.length) {
          baseJob.schoolApproval = {
            id: job.approvals[0].id,
            status: job.approvals[0].status,
            comments: job.approvals[0].comments
          };
        }
        
        return baseJob;
      });
      
      return {
        success: true,
        statusCode: 200,
        data: {
          jobs,
          pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            itemsPerPage: limit
          }
        }
      };
    } catch (error) {
      return ErrorHandler.handleServiceError(error, {}, 'JOB SERVICE');
    }
  }
  
  static async getJob(id, user) {
    try {
      const includeModels = [
        {
          model: Company,
          attributes: ['id', 'name']
        }
      ];
      
      // For students, include school approval to check if it's approved
      if (user.role === 'user' && user.schoolId) {
        includeModels.push({
          model: JobApproval,
          as: 'approvals',
          required: false,
          where: {
            schoolId: user.schoolId
          }
        });
      }
      
      const job = await Job.findByPk(id, {
        include: includeModels
      });
      
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
      
      // For company admins, check ownership
      if (user.role === 'company_admin' && job.companyId !== user.companyId) {
        return {
          success: false,
          statusCode: 403,
          data: { 
            error: 'You do not have permission to view this job',
            code: 'PERMISSION_DENIED'
          }
        };
      }
      
      // For students, check if job is approved by their school
      if (user.role === 'user' && user.schoolId) {
        const isApprovedBySchool = job.approvals && 
                                  job.approvals.some(approval => 
                                    approval.schoolId === user.schoolId && 
                                    approval.status === 'approved');
        
        if (!isApprovedBySchool) {
          return {
            success: false,
            statusCode: 403,
            data: { 
              error: 'This job is not available for your school',
              code: 'JOB_NOT_APPROVED'
            }
          };
        }
      }
      
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
            company: job.Company,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt
          }
        }
      };
    } catch (error) {
      return ErrorHandler.handleServiceError(error, { id }, 'JOB SERVICE');
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
