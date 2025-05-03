import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class JobApproval extends Model {
    static associate(models) {
      JobApproval.belongsTo(models.Job, { foreignKey: 'jobId' });
      JobApproval.belongsTo(models.School, { foreignKey: 'schoolId' });
    }
  }
  
  JobApproval.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    jobId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    schoolId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'JobApproval',
    tableName: 'job_approvals'
  });
  
  return JobApproval;
};
