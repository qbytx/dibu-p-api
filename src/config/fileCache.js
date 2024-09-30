'use strict';

const fsPromises = require('node:fs').promises;

const { paths, FILES } = require('./paths');

const publicFiles = paths.public.files;

const fileCache = {};

const filePathMap = new Map([
  [FILES.fileIndex, publicFiles[FILES.fileIndex]],
  [FILES.file404, publicFiles[FILES.file404]]
]);

const isFileCached = (fileKey) => {
  return fileCache[fileKey] && fileCache[fileKey].file != null;
};

const loadFileCache = async (fastify) => {
  for (const [k, v] of filePathMap) {
    if (isFileCached(k)) {
      console.error(`duplicate file caching: ${k} --- ${v}`);
      continue;
    }
    try {
      fileCache[k] = {
        key: k,
        path: v,
        file: null
      };

      fileCache[k].file = await fsPromises.readFile(v);

      if (fileCache[k] != null) {
        fastify.log.info(`[FILE] loaded: ${k}`);
      }
    } catch (error) {
      const errorMsg = `Failed to read file [${k}] at [${v}]: ${error.message}`;
      console.error(errorMsg);
      fastify.log.error(errorMsg);
    }
  }
};

module.exports = {
  fileCache,
  loadFileCache
};
