module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'companyId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'companies',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'companyId');
  }
};
