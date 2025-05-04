import { JobService } from '../services/job.service.js';
import { asyncHandler } from '../middleware/async.js';

export const createJob = asyncHandler(async (req, res) => {
  const result = await JobService.createJob(req.body, req.user);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
});

export const getJobs = asyncHandler(async (req, res) => {
  if (req.query.status === '') {
    delete req.query.status;
  }
  
  const user = req.user || { role: 'public' };
  console.log('User in getJobs controller:', user);
  
  const jobs = await JobService.getJobs(req.query, user);
  
  res.status(200).json({ 
    success: true, 
    count: jobs.length, 
    data: jobs 
  });
});

export const getJob = asyncHandler(async (req, res) => {
  const user = req.user || { role: 'public' };
  console.log('User in getJob controller:', user);
  
  const job = await JobService.getJob(req.params.id, user);
  res.status(200).json({ success: true, data: job });
});

export const updateJob = asyncHandler(async (req, res) => {
  const result = await JobService.updateJob(req.params.id, req.body, req.user);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
});

export const deleteJob = asyncHandler(async (req, res) => {
  const result = await JobService.deleteJob(req.params.id, req.user);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
});
