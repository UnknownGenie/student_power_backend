import express from 'express';
import { signup, signin, getMe } from '../controllers/auth.controller.js';
import { createUser, getUsers } from '../controllers/user.controller.js';
import { 
  createJob, getJobs, getJob, updateJob, deleteJob 
} from '../controllers/job.controller.js';
import { 
  approveJob, getJobApprovals, getSchoolApprovedJobs 
} from '../controllers/jobApproval.controller.js';
import { 
  applyForJob, getStudentApplications, getJobApplications, getAccessibleJobApplications
} from '../controllers/jobApplication.controller.js';
import { protect } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

export const router = express.Router();

// Auth routes
router.post('/auth/signup', signup);
router.post('/auth/signin', signin);
router.get('/auth/me', protect, getMe);

// User management routes
router.post('/users', protect, createUser);
router.get('/users', protect, getUsers);

// Job routes
router.post('/jobs', protect, createJob);
router.get('/jobs', optionalAuth, getJobs);
router.get('/jobs/:id', optionalAuth, getJob);
router.put('/jobs/:id', protect, updateJob);
router.delete('/jobs/:id', protect, deleteJob);

// Job approval routes
router.post('/jobs/:jobId/approve', protect, approveJob);
router.get('/jobs/:jobId/approvals', protect, getJobApprovals);
router.get('/schools/approved-jobs', optionalAuth, getSchoolApprovedJobs);

// Job application routes
router.post('/jobs/:jobId/apply', protect, applyForJob);
router.get('/applications', protect, getStudentApplications);
router.get('/jobs/:jobId/applications', protect, getJobApplications);
router.get('/jobs/:jobId/applicants', protect, getAccessibleJobApplications);
