import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class School extends Model {
    static associate(models) {
      School.hasMany(models.User, { foreignKey: 'schoolId', as: 'users' });
    }
  }
  
  School.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
    modelName: 'School',
    tableName: 'schools',
    timestamps: true
  });
  
  return School;
};
