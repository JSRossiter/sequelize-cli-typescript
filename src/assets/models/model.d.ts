import { type } from 'node:os';

interface <%= name %>Attributes {
  id: number;
  <% attributes.forEach(function(attribute, index) { %>
    <%= attribute.fieldName %>: <%= attribute.dataFunction ? `${attribute.dataFunction.toUpperCase()}(DataTypes.${attribute.dataType.toUpperCase()})` : attribute.dataValues ? attribute.dataValues.split(', ').join(' | ') : attribute.jsType %>;
  <% }) %>
  createdAt: Date;
  updatedAt: Date;
}

type <%= name %>CreationAttributes = import('sequelize/types').Optional<
  <%= name %>Attributes,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
>;
