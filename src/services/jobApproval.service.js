import { Job, JobApproval, Company, School } from '../models/index.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import db from '../config/database.js';

export class JobApprovalService {
  static async approveJob(jobId, data, user) {
    const transaction = await db.transaction();
    
    try {
      if (user.role !== 'school_admin') {
        return {
          success: false,
          statusCode: 403,
          data: { error: 'Only school admins can approve jobs', code: 'PERMISSION_DENIED' }
        };
      }
      
      if (!user.schoolId) {
        return {
          success: false,
          statusCode: 403,
          data: { error: 'School admin must be associated with a school', code: 'INVALID_USER' }
        };
      }
      
      const job = await Job.findByPk(jobId);
      
      if (!job) {
        return {
          success: false,
          statusCode: 404,
          data: { error: 'Job not found', code: 'NOT_FOUND' }
        };
      }
      
      const existingApproval = await JobApproval.findOne({
        where: { jobId, schoolId: user.schoolId }
      });
      
      if (existingApproval) {
        await existingApproval.update({
          status: data.status || 'approved',
          comments: data.comments
        }, { transaction });
      } else {
        await JobApproval.create({
          jobId,
          schoolId: user.schoolId,
          status: data.status || 'approved',
          comments: data.comments
        }, { transaction });
        
        // Increment approval count
        await job.increment('approvalCount', { transaction });
      }
      
      if (data.status === 'approved') {
        // Set job as approved
        await job.update({ isApproved: true }, { transaction });
      }
      
      await transaction.commit();
      
      return {
        success: true,
        statusCode: 200,
        data: { message: 'Job approval status updated' }
      };
    } catch (error) {
      await transaction.rollback();
      return ErrorHandler.handleServiceError(error, { jobId, ...data }, 'JOB APPROVAL SERVICE');
    }
  }
  
  static async getJobApprovals(jobId, query, user) {
    try {
      const job = await Job.findByPk(jobId);
      
      if (!job) {
        return {
          success: false,
          statusCode: 404,
          data: { error: 'Job not found', code: 'NOT_FOUND' }
        };
      }
      
      // For company users, check if they own the job
      if (user.role === 'company_admin' && job.companyId !== user.companyId) {
        return {
          success: false,
          statusCode: 403,
          data: { error: 'You do not have permission to view this job\'s approvals', code: 'PERMISSION_DENIED' }
        };
      }
      
      const page = parseInt(query.page, 10) || 1;
      const limit = parseInt(query.limit, 10) || 10;
      const offset = (page - 1) * limit;
      
      const { count, rows } = await JobApproval.findAndCountAll({
        where: { jobId },
        include: [
          {
            model: School,
            attributes: ['id', 'name']
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });
      
      return {
        success: true,
        statusCode: 200,
        data: {
          approvals: rows,
          pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            itemsPerPage: limit
          }
        }
      };
    } catch (error) {
      return ErrorHandler.handleServiceError(error, { jobId }, 'JOB APPROVAL SERVICE');
    }
  }
  
  static async getSchoolApprovedJobs(query, user) {
    try {
      if (user.role !== 'school_admin') {
        return {
          success: false,
          statusCode: 403,
          data: { error: 'Only school admins can view approved jobs', code: 'PERMISSION_DENIED' }
        };
      }
      
      const page = parseInt(query.page, 10) || 1;
      const limit = parseInt(query.limit, 10) || 10;
      const offset = (page - 1) * limit;
      
      const { count, rows } = await JobApproval.findAndCountAll({
        where: { 
          schoolId: user.schoolId,
          status: 'approved'
        },
        include: [
          {
            model: Job,
            attributes: ['id', 'title', 'description', 'expiresAt', 'status', 'applicationCount'],
            include: [
              {
                model: Company,
                attributes: ['id', 'name']
              }
            ]
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });
      
      return {
        success: true,
        statusCode: 200,
        data: {
          approvedJobs: rows.map(approval => approval.Job),
          pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            itemsPerPage: limit
          }
        }
      };
    } catch (error) {
      return ErrorHandler.handleServiceError(error, {}, 'JOB APPROVAL SERVICE');
    }
  }
}
