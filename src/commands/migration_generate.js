import clc from 'cli-color';
import fs from 'fs';
import { _baseOptions, _underscoreOption } from '../core/yargs';
import helpers from '../helpers';

exports.builder = (yargs) =>
  _underscoreOption(
    _baseOptions(yargs)
      .option('name', {
        describe: 'Defines the name of the migration',
        type: 'string',
        demandOption: true,
      })
      .option('model', {
        describe: 'Defines the model to apply the migration',
        type: 'string',
      })
      .option('attributes', {
        describe: 'A list of attributes to add',
        type: 'string',
      })
  ).argv;

exports.handler = function (args) {
  if (args.model) {
    checkModelFileExistence(args);
  }
  if (args.attributes && !args.model) {
    helpers.view.error('Model must be specified with attributes');
  }
  helpers.init.createMigrationsFolder();

  const attributes = args.attributes
    ? helpers.model.transformAttributes(args.attributes)
    : [];
  fs.writeFileSync(
    helpers.path.getMigrationPath(args.name),
    helpers.template.render(
      'migrations/skeleton.js',
      {
        tableName: args.model && helpers.migration.getTableName(args.model),
        attributes: attributes,
      },
      {
        beautify: false,
      }
    )
  );

  if (args.model) {
    const modelPath = helpers.path.getModelPath(args.model);
    const typeLine = helpers.asset.findLine(
      modelPath,
      0,
      '    public readonly createdAt'
    );
    const typeLines = attributes
      .map(
        (attribute) =>
          `    public ${attribute.fieldName}!: ${
            attribute.dataValues
              ? attribute.dataValues.split(', ').join(' | ')
              : attribute.jsType
          };`
      )
      .join('\n');
    helpers.asset.insertLine(modelPath, typeLine, typeLines);
    const initLine = helpers.asset.findLine(modelPath, 0, '    },');
    const initLines = attributes
      .map(
        (attribute) =>
          `      ${attribute.fieldName}: DataTypes.${
            attribute.dataFunction
              ? `${attribute.dataFunction.toUpperCase()}(Sequelize.${attribute.dataType.toUpperCase()})`
              : attribute.dataValues
              ? `${attribute.dataType.toUpperCase()}(${attribute.dataValues})`
              : attribute.dataType.toUpperCase()
          },`
      )
      .join('\n');
    helpers.asset.insertLine(modelPath, initLine, initLines);

    const modelDeclarationPath = helpers.path.getModelDeclarationPath(
      args.model
    );
    const declarationLine = helpers.asset.findLine(
      modelDeclarationPath,
      0,
      '}'
    );
    const declarationLines = attributes
      .map(
        (attribute) =>
          `  ${attribute.fieldName}: ${
            attribute.dataValues
              ? attribute.dataValues.split(', ').join(' | ')
              : attribute.jsType
          };`
      )
      .join('\n');
    helpers.asset.insertLine(
      modelDeclarationPath,
      declarationLine,
      declarationLines
    );
  }

  helpers.view.log(
    'New migration was created at',
    clc.blueBright(helpers.path.getMigrationPath(args.name)),
    '.'
  );

  process.exit(0);
};

function checkModelFileExistence(args) {
  const modelPath = helpers.path.getModelPath(args.model);

  if (!helpers.model.modelFileExists(modelPath)) {
    helpers.view.notifyAboutExistingFile(modelPath);
    process.exit(1);
  }
}
