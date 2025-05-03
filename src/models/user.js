import { Model, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default (sequelize) => {
  class User extends Model {
    getSignedJwtToken() {
      return jwt.sign(
        { id: this.id, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );
    }
    
    static associate(models) {
      User.belongsTo(models.School, { foreignKey: 'schoolId' });
      User.belongsTo(models.Company, { foreignKey: 'companyId' });
    }
  }
  
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'school_admin', 'company_admin', 'user'),
      defaultValue: 'user'
    },
    role_in_organization: {
      type: DataTypes.STRING,
      allowNull: true
    },
    schoolId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users'
  });
  
  User.beforeCreate(async (user) => {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  });
  
  return User;
};
