'use strict';
const fp = require('fastify-plugin');
const config = require('config');
const { join, resolve } = require('node:path');
const Joi = require('joi');
const PLUGINS = require('../../data/json/plugins.json');

// Define the API version and root directory
const API_VERSION = config.get('api').name;
const ROOT_DIR = resolve(__dirname, '../../../');

const FILEKEYS = Object.freeze({
    FILE_INDEX: 'index',
    FILE_404: '404'
});

/**
 * Filepaths Schema
 */
const FilepathsSchema = Joi.object({
  public: Joi.object().default({}),
  source: Joi.object().default({})
}).required();

/**
 * Path Schema
 */
const pathSchema = Joi.object({
  root: Joi.string().default(ROOT_DIR),
  directories: Joi.object().default({}).required(),
  files: Joi.object().default({}).required()
}).required();

/**
 * File Schema
 */
const fileSchema = Joi.object({
  fileKey: Joi.string().required(),
  fileName: Joi.string().required(),
  filePath: Joi.string().required()
}).required();

/**
 * Utils
 */
/**
 * Gets a Directory
 * @param {string} relPath
 * @returns {string}
 */
const getDir = (relPath) => {
  return join(ROOT_DIR, relPath);
};

/**
 * Gets a Filepath
 * @param {string} relPath
 * @param {string} fileName
 * @returns {string}
 */
const getFp = (relPath, fileName) => {
  return join(ROOT_DIR, relPath, fileName);
};


/**
 * Converts an array of validated files to an object and handles errors
 * @param {Array} files - Array of Joi validation results
 * @param {Object} fastify - Fastify instance for logging
 * @returns {Object} - Object with fileKey as keys and file info as values
 */
function convertFilesToObject (files, fastify) {
  const result = {};
  const errors = [];

  files.forEach((validationResult, index) => {
    if (validationResult.error) {
      errors.push(`Validation error in file ${index}: ${validationResult.error.message}`);
    } else {
      const { fileKey, fileName, filePath } = validationResult.value;
      result[fileKey] = { fileName, filePath };
    }
  });

  if (errors.length > 0) {
    errors.forEach(error => fastify.log.error(error));
    throw new Error('File validation errors occurred. Check logs for details.');
  }

  return result;
}

async function filePaths (fastify, options) {
  /**
   *  PUBLIC FILES
   */
  const filesPublic = [
    fileSchema.validate({
      fileKey: FILEKEYS.FILE_INDEX,
      fileName: 'index.html',
      filePath: getFp('./src/public/', 'index.html')
    }),
    fileSchema.validate({
      fileKey: FILEKEYS.FILE_404,
      fileName: '404.html',
      filePath: getFp('./src/public/', '404.html')
    })
  ];

  const pathPublic = pathSchema.validate({
    root: getDir('./src/public/'),
    directories: {
      css: getDir('./src/public/css'),
      img: getDir('./src/public/img')
    },
    files: convertFilesToObject(filesPublic)
  }).value;

  /**
   *  SOURCE FILES
   */
  const filesSource = [];

  const pathSource = pathSchema.validate({
    root: getDir('./src'),
    directories: {
      plugins: getDir('./src/plugins/'),
      routes: getDir('./src/routes/'),
      data: getDir('./src/data/'),
      json: getDir('./src/data/json/'),
      models: getDir('./src/data/models/'),
      templates: getDir('./src/data/templates/'),
      api: join(getDir(`./src/routes/${API_VERSION}/`))
    },
    files: convertFilesToObject(filesSource);
  }).value;

  // Combine validated
  const { value } = FilepathsSchema.validate({
    public: pathPublic.value,
    source: pathSource.value,
    FILEKEYS
  });

  fastify.decorate(PLUGINS.filePaths.options.name, value);
}

module.exports = fp(filePaths, PLUGINS.filePaths.options.name);
