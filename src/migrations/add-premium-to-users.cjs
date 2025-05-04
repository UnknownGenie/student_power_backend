module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'premium', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'premium');
  }
};
