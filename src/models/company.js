import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Company extends Model {
    static associate(models) {
      Company.hasMany(models.User, { foreignKey: 'companyId', as: 'users' });
      Company.hasMany(models.Job, { foreignKey: 'companyId', as: 'jobs' });
    }
  }
  
  Company.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    }
  }, {
    sequelize,
    modelName: 'Company',
    tableName: 'companies',
    timestamps: true
  });

  return Company;
};
