import { JobApprovalService } from '../services/jobApproval.service.js';

export const approveJob = async (req, res) => {
  const result = await JobApprovalService.approveJob(req.params.jobId, req.body, req.user);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
};

export const getJobApprovals = async (req, res) => {
  const result = await JobApprovalService.getJobApprovals(req.params.jobId, req.query, req.user);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
};

export const getSchoolApprovedJobs = async (req, res) => {
  const result = await JobApprovalService.getSchoolApprovedJobs(req.query, req.user);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
};
