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
  source: Joi.object().default({}),
  fileKeys: Joi.object()
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
const getDir = (relPath) => {
  return join(ROOT_DIR, relPath);
};

const getFp = (relPath, fileName) => {
  return join(ROOT_DIR, relPath, fileName);
};

function convertFilesToObject (files, fastify) {
  const result = {};
  const errors = [];

  files.forEach((validationResult, index) => {
    if (validationResult.error) {
      errors.push(`Validation error in file ${index}: ${validationResult.error.message}`);
      fastify.log.error(`File validation error: ${validationResult.error.message}`, {
        fileIndex: index,
        fileData: validationResult.value // Log the input data for context
      });
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
  // Ensure this section is not logging more than needed
  fastify.log.info('Initializing file paths...');

  // PUBLIC FILES
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
    files: convertFilesToObject(filesPublic, fastify) // Pass fastify for logging
  });

  if (pathPublic.error) {
    fastify.log.error(`Public path validation error: ${pathPublic.error.message}`, {
      value: pathPublic.value // Log the value attempted for validation
    });
    throw new Error('Public path validation failed. Check logs for details.');
  }

  // SOURCE FILES
  const filesSource = []; // Assuming you will fill this in

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
    files: convertFilesToObject(filesSource, fastify) // Pass fastify for logging
  });

  if (pathSource.error) {
    fastify.log.error(`Source path validation error: ${pathSource.error.message}`, {
      value: pathSource.value // Log the value attempted for validation
    });
    throw new Error('Source path validation failed. Check logs for details.');
  }

  // Combine validated
  const { error, value } = FilepathsSchema.validate({
    public: pathPublic.value,
    source: pathSource.value,
    fileKeys: FILEKEYS
  });

  if (error) {
    fastify.log.error(`Filepaths schema validation error: ${error.message}`, {
      value // Log the value attempted for validation
    });
    throw new Error('Invalid filePaths structure. Check logs for details.');
  }

  fastify.decorate(PLUGINS.filePaths.options.name, value);
}

module.exports = fp(filePaths, PLUGINS.filePaths.options);
