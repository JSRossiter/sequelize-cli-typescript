'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
      <% attributes.forEach(function(attribute) { %>
        await queryInterface.addColumn('<%= tableName %>', '<%= attribute.fieldName %>', {
          type: Sequelize.<%= attribute.dataFunction ? `${attribute.dataFunction.toUpperCase()}(Sequelize.${attribute.dataType.toUpperCase()})` : attribute.dataValues ? `${attribute.dataType.toUpperCase()}(${attribute.dataValues})` : attribute.dataType.toUpperCase() %>
        }),
      <% }) %>
  },

  down: async (queryInterface, Sequelize) => {
    <% attributes.forEach(function(attribute) { %>
      await queryInterface.removeColumn('<%= tableName %>', '<%= attribute.fieldName %>')
    <% }) %>
  }
};
