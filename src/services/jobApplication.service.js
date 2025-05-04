import { Job, JobApplication, User, School, Company, JobApproval } from '../models/index.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import db from '../config/database.js';
import { Op, Sequelize } from 'sequelize';

export class JobApplicationService {
  static async applyForJob(jobId, data, user) {
    const transaction = await db.transaction();
    
    try {
      if (user.role !== 'user') {
        return {
          success: false,
          statusCode: 403,
          data: { 
            error: 'Only students can apply for jobs',
            code: 'PERMISSION_DENIED'
          }
        };
      }
      
      const job = await Job.findByPk(jobId);
      
      if (!job) {
        return {
          success: false,
          statusCode: 404,
          data: { 
            error: 'Job not found',
            code: 'JOB_NOT_AVAILABLE'
          }
        };
      }
      
      const existingApplication = await JobApplication.findOne({
        where: {
          jobId,
          userId: user.id
        }
      });
      
      if (existingApplication) {
        return {
          success: false,
          statusCode: 400,
          data: { 
            error: 'You have already applied for this job',
            code: 'ALREADY_APPLIED'
          }
        };
      }
      
      const application = await JobApplication.create({
        jobId,
        userId: user.id,
        status: 'applied',
        coverLetter: data.coverLetter || '',
        resume: data.resume || null
      }, { transaction });
      
      await job.increment('applicationCount', { transaction });
      
      await transaction.commit();
      
      return {
        success: true,
        statusCode: 201,
        data: {
          application: {
            id: application.id,
            status: application.status,
            createdAt: application.createdAt
          }
        }
      };
    } catch (error) {
      await transaction.rollback();
      return ErrorHandler.handleServiceError(error, { jobId, ...data }, 'JOB APPLICATION SERVICE');
    }
  }

  static async getStudentApplications(user, query = {}) {
    try {
      
      const page = parseInt(query.page, 10) || 1;
      const limit = parseInt(query.limit, 10) || 10;
      const offset = (page - 1) * limit;
      
      const { count, rows } = await JobApplication.findAndCountAll({
        where: { userId: user.id },
        include: [
          {
            model: Job,
            include: [{ model: Company, attributes: ['id', 'name'] }]
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
          applications: rows.map(app => ({
            id: app.id,
            status: app.status,
            createdAt: app.createdAt,
            coverLetter: app.coverLetter,
            job: {
              id: app.Job.id,
              title: app.Job.title,
              company: app.Job.Company.name
            }
          })),
          pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            itemsPerPage: limit
          }
        }
      };
    } catch (error) {
      return ErrorHandler.handleServiceError(error, {}, 'JOB APPLICATION SERVICE');
    }
  }

  static async getJobApplications(jobId, user, query = {}) {
    try {
      const job = await Job.findByPk(jobId);
      
      if (!job) {
        return {
          success: false,
          statusCode: 404,
          data: { error: 'Job not found', code: 'NOT_FOUND' }
        };
      }
      
      if (user.role === 'company_admin' && job.companyId !== user.companyId) {
        return {
          success: false,
          statusCode: 403,
          data: { error: 'You can only view applications for your company\'s jobs', code: 'PERMISSION_DENIED' }
        };
      }
      
      if (user.role === 'school_admin') {
        const approval = await JobApproval.findOne({
          where: {
            jobId,
            schoolId: user.schoolId
          }
        });
        
        if (!approval) {
          return {
            success: false,
            statusCode: 403,
            data: { error: 'This job is not approved by your school', code: 'NOT_APPROVED' }
          };
        }
      }
      
      const page = parseInt(query.page, 10) || 1;
      const limit = parseInt(query.limit, 10) || 10;
      const offset = (page - 1) * limit;
      
      const whereClause = { jobId };
      
      if (user.role === 'school_admin') {
        whereClause.userId = {
          [Op.in]: Sequelize.literal(`(SELECT id FROM users WHERE "schoolId" = '${user.schoolId}')`)
        };
      }
      
      const { count, rows } = await JobApplication.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email'],
            include: [
              {
                model: School,
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
          applications: rows.map(app => ({
            id: app.id,
            status: app.status,
            createdAt: app.createdAt,
            coverLetter: app.coverLetter,
            student: {
              id: app.User.id,
              name: app.User.name,
              email: app.User.email,
              school: app.User.School?.name
            }
          })),
          pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            itemsPerPage: limit
          }
        }
      };
    } catch (error) {
      return ErrorHandler.handleServiceError(error, {}, 'JOB APPLICATION SERVICE');
    }
  }

  static async getAccessibleJobApplications(jobId, user, query = {}) {
    try {
      const job = await Job.findByPk(jobId);
      
      if (!job) {
        return {
          success: false,
          statusCode: 404,
          data: { error: 'Job not found', code: 'NOT_FOUND' }
        };
      }
      
      // Permission check based on user role
      if (user.role === 'user') {
        // Regular users can only see applications for jobs they applied to
        const userApplication = await JobApplication.findOne({
          where: { jobId, userId: user.id }
        });
        
        if (!userApplication) {
          return {
            success: false,
            statusCode: 403,
            data: { error: 'You can only view applications for jobs you have applied to', code: 'PERMISSION_DENIED' }
          };
        }
      } else if (user.role === 'school_admin') {
        // School admins can see applications for jobs approved by their school
        const approval = await JobApproval.findOne({
          where: {
            jobId,
            schoolId: user.schoolId,
            status: 'approved'
          }
        });
        
        if (!approval) {
          return {
            success: false,
            statusCode: 403,
            data: { error: 'This job is not approved by your school', code: 'NOT_APPROVED' }
          };
        }
      } else if (user.role === 'company_admin') {
        // Company admins can see applications for their company's jobs
        if (job.companyId !== user.companyId) {
          return {
            success: false,
            statusCode: 403,
            data: { error: 'You can only view applications for your company\'s jobs', code: 'PERMISSION_DENIED' }
          };
        }
      } else {
        return {
          success: false,
          statusCode: 403,
          data: { error: 'Unauthorized access', code: 'UNAUTHORIZED' }
        };
      }
      
      const page = parseInt(query.page, 10) || 1;
      const limit = parseInt(query.limit, 10) || 10;
      const offset = (page - 1) * limit;
      
      const whereClause = { jobId };
      
      // For school admins, only show applications from their school's students
      if (user.role === 'school_admin' && user.schoolId) {
        whereClause.userId = {
          [Op.in]: Sequelize.literal(`(SELECT id FROM users WHERE "schoolId" = '${user.schoolId}')`)
        };
      }
      
      // For regular users, only show anonymized data of other applicants
      const includeOptions = user.role === 'user' ? 
        [] : 
        [{
          model: User,
          attributes: ['id', 'name', 'email'],
          include: [{
            model: School,
            attributes: ['id', 'name']
          }]
        }];
      
      const { count, rows } = await JobApplication.findAndCountAll({
        where: whereClause,
        include: includeOptions,
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });
      
      // Format response based on user role
      const applications = rows.map(app => {
        // Format for regular users (anonymized)
        if (user.role === 'user') {
          return {
            id: app.id,
            status: app.status === 'applied' ? 'Applied' : app.status,
            applied: app.createdAt,
            isCurrentUser: app.userId === user.id
          };
        }
        
        // Format for admins (full details)
        return {
          id: app.id,
          status: app.status,
          createdAt: app.createdAt,
          coverLetter: app.coverLetter,
          student: app.User ? {
            id: app.User.id,
            name: app.User.name,
            email: app.User.email,
            school: app.User.School?.name
          } : null
        };
      });
      
      return {
        success: true,
        statusCode: 200,
        data: {
          applications,
          pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            itemsPerPage: limit
          },
          jobInfo: {
            id: job.id,
            title: job.title,
            totalApplicants: count
          }
        }
      };
    } catch (error) {
      return ErrorHandler.handleServiceError(error, { jobId }, 'JOB APPLICATION SERVICE');
    }
  }

  static async getCompanyApplications(companyId, query = {}) {
    try {
      const { limit = 10, page = 1, status } = query;
      const skip = (page - 1) * limit;
      
      const filter = {
        include: [
          {
            model: Job,
            where: { companyId },
            required: true
          },
          {
            model: User,
            attributes: ['id', 'name', 'email']
          }
        ],
        limit: parseInt(limit),
        offset: skip,
        order: [['createdAt', 'DESC']]
      };
      
      if (status) {
        filter.where = { status };
      }
      
      const applications = await JobApplication.findAll(filter);
      
      return {
        success: true,
        statusCode: 200,
        data: [ ...applications ]
      };
    } catch (error) {
      return ErrorHandler.handleServiceError(error, { companyId }, 'JOB APPLICATION SERVICE');
    }
  }
  
  static async getAllApplications() {
    try {
      const applications = await JobApplication.findAll({
        include: [
          {
            model: Job,
            include: [{ model: Company, attributes: ['id', 'name'] }]
          },
          {
            model: User,
            attributes: ['id', 'name', 'email', 'role', 'schoolId']
          }
        ]
      });
      
      return applications;
    } catch (error) {
      console.error('[JOB APPLICATION SERVICE ERROR]', error);
      throw error;
    }
  }

  static async applyToJob(jobId, userId, data = {}) {
    try {
      const job = await Job.findByPk(jobId);
      
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
      
      // Check if user has already applied
      const existingApplication = await JobApplication.findOne({
        where: { jobId, userId }
      });
      
      if (existingApplication) {
        return {
          success: false,
          statusCode: 400,
          data: {
            error: 'You have already applied for this job',
            code: 'ALREADY_APPLIED'
          }
        };
      }
      
      const application = await JobApplication.create({
        jobId,
        userId,
        resume: data.resume || null,
        coverLetter: data.coverLetter || null,
        status: 'pending'
      });
      
      // Update application count on job
      await job.increment('applicationCount');
      
      return {
        success: true,
        statusCode: 201,
        data: {
          application: {
            id: application.id,
            status: application.status,
            createdAt: application.createdAt
          }
        }
      };
    } catch (error) {
      return ErrorHandler.handleServiceError(error, { jobId, userId, ...data }, 'JOB APPLICATION SERVICE');
    }
  }
}
