import fs from 'fs';
import path from 'path';
import getYArgs from '../core/yargs';

const resolve = require('resolve').sync;

const args = getYArgs().argv;

function format(i) {
  return parseInt(i, 10) < 10 ? '0' + i : i;
}

function getCurrentYYYYMMDDHHmms() {
  const date = new Date();
  return [
    date.getUTCFullYear(),
    format(date.getUTCMonth() + 1),
    format(date.getUTCDate()),
    format(date.getUTCHours()),
    format(date.getUTCMinutes()),
    format(date.getUTCSeconds()),
  ].join('');
}

module.exports = {
  getPath(type) {
    type = type + 's';

    let result = args[type + 'Path'] || path.resolve(process.cwd(), type);

    if (path.normalize(result) !== path.resolve(result)) {
      // the path is relative
      result = path.resolve(process.cwd(), result);
    }

    return result;
  },

  getFileName(type, name, options) {
    return this.addFileExtension(
      [getCurrentYYYYMMDDHHmms(), name ? name : 'unnamed-' + type].join('-'),
      options
    );
  },

  getFileExtension() {
    return 'js';
  },

  addFileExtension(basename, options) {
    return [
      basename,
      options && options.extension
        ? options.extension
        : this.getFileExtension(options),
    ].join('.');
  },

  getMigrationPath(migrationName) {
    return path.resolve(
      this.getPath('migration'),
      this.getFileName('migration', migrationName)
    );
  },

  getSeederPath(seederName) {
    return path.resolve(
      this.getPath('seeder'),
      this.getFileName('seeder', seederName)
    );
  },

  getModelsPath() {
    return args.modelsPath || path.resolve(process.cwd(), 'models');
  },

  getModelDeclarationsPath() {
    return (
      args.modelDeclarationsPath ||
      path.resolve(process.cwd(), 'types', 'models')
    );
  },

  getModelPath(modelName) {
    return path.resolve(
      this.getModelsPath(),
      this.addFileExtension(modelName, { extension: 'ts' })
    );
  },

  getModelDeclarationPath(modelName) {
    return path.resolve(
      this.getModelDeclarationsPath(),
      this.addFileExtension(modelName, { extension: 'd.ts' })
    );
  },

  resolve(packageName) {
    let result;

    try {
      result = resolve(packageName, { basedir: process.cwd() });
      result = require(result);
    } catch (e) {
      try {
        result = require(packageName);
      } catch (err) {
        // ignore error
      }
    }

    return result;
  },

  existsSync(pathToCheck) {
    if (fs.accessSync) {
      try {
        fs.accessSync(pathToCheck, fs.R_OK);
        return true;
      } catch (e) {
        return false;
      }
    } else {
      return fs.existsSync(pathToCheck);
    }
  },
};
