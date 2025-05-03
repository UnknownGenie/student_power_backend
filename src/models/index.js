import { Sequelize } from 'sequelize';
import config from '../config/database.js';
import userModel from './user.js';
import schoolModel from './school.js';
import companyModel from './company.js';
import jobModel from './job.js';
import jobApprovalModel from './jobApproval.js';
import jobApplicationModel from './jobApplication.js';

const db = {};

const sequelize = config;

db.User = userModel(sequelize);
db.School = schoolModel(sequelize);
db.Company = companyModel(sequelize);
db.Job = jobModel(sequelize);
db.JobApproval = jobApprovalModel(sequelize);
db.JobApplication = jobApplicationModel(sequelize);

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
export const { User, School, Company, Job, JobApproval, JobApplication } = db;
