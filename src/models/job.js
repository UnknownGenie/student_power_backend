import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Job extends Model {
    static associate(models) {
      Job.belongsTo(models.Company, { foreignKey: 'companyId' });
      Job.hasMany(models.JobApproval, { foreignKey: 'jobId', as: 'approvals' });
      Job.hasMany(models.JobApplication, { foreignKey: 'jobId', as: 'applications' });
    }
  }
  
  Job.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'draft', 'closed'),
      defaultValue: 'active'
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'companies',
        key: 'id'
      }
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    approvalCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    applicationCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Job',
    tableName: 'jobs'
  });
  
  return Job;
};
