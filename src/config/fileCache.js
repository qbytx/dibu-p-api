'use strict';

const fsPromises = require('node:fs').promises;

const { filePaths, FILES } = require('./filePaths');

const fileCache = {};

const filePathMap = new Map([
  [FILES.HTML_INDEX, filePaths.public.files[FILES.HTML_INDEX]],
  [FILES.HTML_404, filePaths.public.files[FILES.HTML_404]]
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
