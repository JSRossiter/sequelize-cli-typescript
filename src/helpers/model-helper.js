import helpers from './index';

const Sequelize = helpers.generic.getSequelize();
const validAttributeFunctionType = ['array', 'enum'];

/**
 * Check the given dataType actual exists.
 * @param {string} dataType
 */
function validateDataType(dataType) {
  if (!Sequelize.DataTypes[dataType.toUpperCase()]) {
    throw new Error(`Unknown type '${dataType}'`);
  }

  return dataType;
}

function getJsType(dataType) {
  switch (dataType) {
    case 'string':
    case 'decimal':
    case 'text':
      return 'string';
    case 'integer':
    case 'bigint':
    case 'float':
      return 'number';
    case 'date':
      return 'date';
    case 'boolean':
      return 'boolean';
    default:
      return dataType;
  }
}

function formatAttributes(attribute) {
  let result;
  const split = attribute.split(':');

  if (split.length === 2) {
    result = {
      fieldName: split[0],
      dataType: split[1],
      jsType: getJsType(split[1]),
      dataFunction: null,
      dataValues: null,
    };
  } else if (split.length === 3) {
    const validValues = /^\{(,? ?[A-z0-9 ]+)+\}$/;
    const isValidFunction =
      validAttributeFunctionType.indexOf(split[1].toLowerCase()) !== -1;
    const isValidValue =
      validAttributeFunctionType.indexOf(split[2].toLowerCase()) === -1 &&
      split[2].match(validValues) === null;
    const isValidValues = split[2].match(validValues) !== null;

    if (isValidFunction && isValidValue && !isValidValues) {
      result = {
        fieldName: split[0],
        dataType: split[2],
        dataFunction: split[1],
        dataValues: null,
      };
    }

    if (isValidFunction && !isValidValue && isValidValues) {
      result = {
        fieldName: split[0],
        dataType: split[1],
        dataFunction: null,
        dataValues: split[2]
          .replace(/(^\{|\}$)/g, '')
          .split(/\s*,\s*/)
          .map((s) => `'${s}'`)
          .join(', '),
      };
    }
  }

  return result;
}

module.exports = {
  transformAttributes(flag) {
    /*
      possible flag formats:
      - first_name:string,last_name:string,bio:text,role:enum:{Admin, 'Guest User'},reviews:array:string
      - 'first_name:string last_name:string bio:text role:enum:{Admin, Guest User} reviews:array:string'
      - 'first_name:string, last_name:string, bio:text, role:enum:{Admin, Guest User} reviews:array:string'
    */
    const attributeStrings = flag
      .split('')
      .map(
        (() => {
          let openValues = false;
          return (a) => {
            if ((a === ',' || a === ' ') && !openValues) {
              return '  ';
            }
            if (a === '{') {
              openValues = true;
            }
            if (a === '}') {
              openValues = false;
            }

            return a;
          };
        })()
      )
      .join('')
      .split(/\s{2,}/);

    return attributeStrings.map((attribute) => {
      const formattedAttribute = formatAttributes(attribute);

      try {
        validateDataType(formattedAttribute.dataType);
      } catch (err) {
        throw new Error(
          `Attribute '${attribute}' cannot be parsed: ${err.message}`
        );
      }

      return formattedAttribute;
    });
  },

  generateFileContent(args) {
    return helpers.template.render('models/model.ts', {
      name: args.name,
      attributes: this.transformAttributes(args.attributes),
      underscored: args.underscored,
    });
  },

  generateDeclarationFileContent(args) {
    return helpers.template.render('models/model.d.ts', {
      name: args.name,
      attributes: this.transformAttributes(args.attributes),
      underscored: args.underscored,
    });
  },

  generateFile(args) {
    const modelPath = helpers.path.getModelPath(args.name);

    helpers.asset.write(modelPath, this.generateFileContent(args));
  },

  generateDeclarationFile(args) {
    const declarationPath = helpers.path.getModelDeclarationPath(args.name);

    helpers.asset.write(
      declarationPath,
      this.generateDeclarationFileContent(args)
    );
  },

  modelFileExists(filePath) {
    return helpers.path.existsSync(filePath);
  },

  addToIndexFile(args) {
    const indexPath = helpers.path.getModelPath('index');
    const importLine = helpers.asset.findLine(indexPath, 0, 'const env') - 1;
    helpers.asset.insertLine(
      indexPath,
      importLine,
      `import ${args.name}Factory from './${args.name}'`
    );

    const dbLine = helpers.asset.findLine(indexPath, 0, 'const db: DB');
    const factoryLine = helpers.asset.findLine(indexPath, dbLine, '};');
    helpers.asset.insertLine(
      indexPath,
      factoryLine,
      `  ${args.name}: ${args.name}Factory(sequelize, DataTypes)`
    );
  },

  addToIndexDeclarationFile(args) {
    const indexPath = helpers.path.getModelDeclarationPath('index');
    const lastLine = helpers.asset.findLine(indexPath, 0, '}');
    helpers.asset.insertLine(
      indexPath,
      lastLine,
      `  ${args.name}: import('../../models/${args.name}').${args.name}Static;`
    );
  },
};
