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
      const errorMsg = `Failed to read file [${fileKey}] at [${filePath}]: ${error.message}`;
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

async function fileCachePlugin (fastify, options) {
  const fileCache = createFileCache();

  for (const fileKey of FILES) {
    const filePath = fastify.filePaths.public.files[fileKey];
    if (!filePath) {
      fastify.log.warn(`File path not found for key: ${fileKey}`);
      continue;
    }
    await fileCache.cacheFile(fileKey, filePath, fastify);
  }

  /**
   * @ Decorate
   */

  fastify.decorate(PLUGINS.fileCache.options.name, {
    getFile: fileCache.getFile,
    getFilePath: fileCache.getFilePath,
    isFileCached: fileCache.isFileCached
  });
}

module.exports = fp(fileCachePlugin, PLUGINS.fileCache.options);
