import { JobApplicationService } from '../services/jobApplication.service.js';
import { asyncHandler } from '../middleware/async.js';

export const applyForJob = asyncHandler(async (req, res) => {
  
  const result = await JobApplicationService.applyForJob(req.params.jobId, req.body, req.user);
  return res.status(result.statusCode).json(result.success ? result.data : { success: false, ...result.data });
});

export const getStudentApplications = asyncHandler(async (req, res) => {
  if (req.user.role !== 'user' && req.user.role !== 'company_admin' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: "You don't have permission to access this resource",
      code: "PERMISSION_DENIED"
    });
  }
  
  let applications;
  
  if (req.user.role === 'user') {
    applications = await JobApplicationService.getStudentApplications(req.user)
  } else if (req.user.role === 'company_admin') {
    applications = await JobApplicationService.getCompanyApplications(req.user.companyId);
  } else {
    applications = await JobApplicationService.getAllApplications();
  }
  
  res.status(200).json({
    success: true,
    count: applications.length,
    data: applications
  });
});

export const getJobApplications = asyncHandler(async (req, res) => {
  const applications = await JobApplicationService.getJobApplications(req.params.jobId, req.user);
  res.status(200).json({
    success: true,
    count: applications.length,
    data: applications
  });
});

export const getAccessibleJobApplications = asyncHandler(async (req, res) => {
  const applications = await JobApplicationService.getAccessibleJobApplications(req.params.jobId, req.user);
  console.log(applications);
  res.status(200).json(applications);
});
