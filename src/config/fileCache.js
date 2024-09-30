'use strict';

const fsPromises = require('node:fs').promises;

const { paths, FILES } = require('./paths');

const publicFiles = paths.public.files;

const fileCache = {};

const filePathMap = new Map([
  [FILES.fileIndex, publicFiles[FILES.fileIndex]],
  [FILES.file404, publicFiles[FILES.file404]]
]);

const loadFileCache = async (fastify) => {
  for (const [k, v] of filePathMap) {
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
      fastify.log.error(`Failed to read file [${k}] at [${v}]: ${error.message}`);
      process.exit(1);
    }
  }
};

module.exports = {
  fileCache,
  loadFileCache
};
