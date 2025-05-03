import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class JobApplication extends Model {
    static associate(models) {
      JobApplication.belongsTo(models.Job, { foreignKey: 'jobId' });
      JobApplication.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }
  
  JobApplication.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    jobId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('applied', 'shortlisted', 'rejected', 'hired'),
      defaultValue: 'applied'
    },
    coverLetter: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'JobApplication',
    tableName: 'job_applications'
  });
  
  return JobApplication;
};
