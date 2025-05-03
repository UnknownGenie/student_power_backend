module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      'ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS \'user\''
    );
  },
  down: async (queryInterface, Sequelize) => {
    // Cannot remove ENUM values in PostgreSQL
    // You would need to create a new type and migrate data
  }
};
