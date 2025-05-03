import { JobService } from '../services/job.service.js';

export const createJob = async (req, res) => {
  const result = await JobService.createJob(req.body, req.user);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
};

export const getJobs = async (req, res) => {
  const result = await JobService.getJobs(req.user, req.query);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
};

export const getJob = async (req, res) => {
  const result = await JobService.getJob(req.params.id, req.user);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
};

export const updateJob = async (req, res) => {
  const result = await JobService.updateJob(req.params.id, req.body, req.user);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
};

export const deleteJob = async (req, res) => {
  const result = await JobService.deleteJob(req.params.id, req.user);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
};
