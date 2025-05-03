import { JobApplicationService } from '../services/jobApplication.service.js';

export const applyForJob = async (req, res) => {
  const result = await JobApplicationService.applyForJob(req.params.jobId, req.body, req.user);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
};

export const getStudentApplications = async (req, res) => {
  const result = await JobApplicationService.getStudentApplications(req.user, req.query);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
};

export const getJobApplications = async (req, res) => {
  const result = await JobApplicationService.getJobApplications(req.params.jobId, req.user, req.query);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
};

export const getAccessibleJobApplications = async (req, res) => {
  const result = await JobApplicationService.getAccessibleJobApplications(req.params.jobId, req.user, req.query);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
};
