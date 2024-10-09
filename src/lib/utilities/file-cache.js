'use strict';
const fp = require('fastify-plugin');
const fsPromises = require('node:fs').promises;
const Joi = require('joi');
const PLUGINS = require('../../data/json/plugins.json');

// File cache schema
const FileCacheSchema = Joi.object({
  fileKey: Joi.string().required(),
  fileName: Joi.string().required(),
  filePath: Joi.string().required(),
  contents: Joi.binary().required()
}).required();

function createFileCache () {
  const cache = new Map();

  function isFileCached (fileKey) {
    return cache.has(fileKey);
  }

  async function cacheFile (fileKey, fileInfo, fastify) {
    if (isFileCached(fileKey)) {
      fastify.log.warn(`File already cached: ${fileKey} - ${fileInfo.filePath}`);
      return;
    }

    try {
      const fileContent = await fsPromises.readFile(fileInfo.filePath);
      const validatedCache = FileCacheSchema.validate({
        fileKey,
        fileName: fileInfo.fileName,
        filePath: fileInfo.filePath,
        contents: fileContent
      });

      if (validatedCache.error) {
        throw new Error(`Validation error for file ${fileKey}: ${validatedCache.error.message}`);
      }

      cache.set(fileKey, validatedCache.value);
      fastify.log.info(`[FILE] cached: ${fileKey}`);
    } catch (error) {
      const errorMsg = `Failed to read or validate file ${fileKey} at ${fileInfo.filePath}\n ${error.message}`;
      fastify.log.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  function getFile (fileKey) {
    return cache.get(fileKey) ?? null;
  }

  function getFilePath (fileKey) {
    return getFile(fileKey)?.filePath ?? null;
  }

  return {
    isFileCached,
    cacheFile,
    getFile,
    getFilePath
  };
}

async function fileCache (fastify, options) {
  const cache = createFileCache();

  // Validate that filePaths.public.files exists and is an object
  const filesSchema = Joi.object().required();
  const { error, value: publicFiles } = filesSchema.validate(fastify.filePaths.public.files);

  if (error) {
    fastify.log.error(`Invalid filePaths structure: ${error.message}`);
    throw error;
  }

  for (const [fileKey, fileInfo] of Object.entries(publicFiles)) {
    if (!fileInfo || !fileInfo.filePath) {
      fastify.log.warn(`Invalid file info for file key: ${fileKey}`);
      continue;
    }

    try {
      fastify.log.info(`Attempting to cache file: ${fileKey}`);
      await cache.cacheFile(fileKey, fileInfo, fastify);
    } catch (error) {
      fastify.log.error(`Failed to cache file ${fileKey}: ${error.message}`);
      // Continue with other files even if one fails
    }
  }

  /**
   * @ Decorate
   */
  fastify.decorate(PLUGINS.fileCache.options.name, {
    getFile: cache.getFile,
    getFilePath: cache.getFilePath,
    isFileCached: cache.isFileCached
  });
}

module.exports = fp(fileCache, PLUGINS.fileCache.options);
