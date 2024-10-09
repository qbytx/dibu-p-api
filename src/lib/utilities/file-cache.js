'use strict';

const fp = require('fastify-plugin');
const fsPromises = require('node:fs').promises;
const FILES = require('../../data/json/files.json');
const PLUGINS = require('../../data/json/plugins.json');

function createFileCache () {
  const cache = new Map();

  function isFileCached (fileKey) {
    return cache.has(fileKey) && cache.get(fileKey).file !== null;
  }

  async function cacheFile (fileKey, filePath, fastify) {
    if (isFileCached(fileKey)) {
      fastify.log.warn(`File already cached: ${fileKey} - ${filePath}`);
      return;
    }

    try {
      const file = await fsPromises.readFile(filePath);
      cache.set(fileKey, { key: fileKey, path: filePath, file });
      fastify.log.info(`[FILE] loaded: ${fileKey}`);
    } catch (error) {
      const errorMsg = `Failed to read file ${fileKey} at ${filePath}\n ${error.message}`;
      fastify.log.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  function getFile (fileKey) {
    return cache.get(fileKey)?.file || null;
  }

  function getFilePath (fileKey) {
    return cache.get(fileKey)?.path || null;
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

  Object.entries(FILES).forEach(async ([fileKey, fileName]) => {
    const filePath = fastify.filePaths.public.files[fileName];
    if (!filePath) {
      fastify.log.warn(`File path not found for file key: ${fileKey}`);
    } else {
      fastify.log.info(`File Loaded: ${filePath}`);
      await cache.cacheFile(fileName, filePath, fastify);
    }
  });

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
