'use strict';

import { DataTypes as DataTypesType, Model, Sequelize } from 'sequelize';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const factory = (sequelize: Sequelize, DataTypes: typeof DataTypesType) => {
  class <%= name %>
    extends Model<<%= name %>Attributes, <%= name %>CreationAttributes>
    implements <%= name %>Attributes {
    public readonly id!: number;

    <% attributes.forEach(function(attribute, index) { %>
      public <%= attribute.fieldName %>!: <%= attribute.dataFunction ? `${attribute.dataFunction.toUpperCase()}(DataTypes.${attribute.dataType.toUpperCase()})` : attribute.dataValues ? attribute.dataValues.split(', ').join(' | ') : attribute.jsType %>;
    <% }) %>

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    static associate (models: DB) {
      // define association here
    }
  };

  <%= name %>.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    <% attributes.forEach(function(attribute, index) { %>
      <%= attribute.fieldName %>: DataTypes.<%= attribute.dataFunction ? `${attribute.dataFunction.toUpperCase()}(DataTypes.${attribute.dataType.toUpperCase()})` : attribute.dataValues ? `${attribute.dataType.toUpperCase()}(${attribute.dataValues})` : attribute.dataType.toUpperCase() %>,
    <% }) %>
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  }, {
    sequelize,
    modelName: '<%= name %>',
    <%= underscored ? 'underscored: true,' : '' %>
  });

  return <%= name %>;
};


export type <%= name %>Static = ReturnType<typeof factory>;
export type <%= name %>Model = InstanceType<<%= name %>Static>;
export default factory;