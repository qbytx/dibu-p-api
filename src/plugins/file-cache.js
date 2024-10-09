'use strict';

const fp = require('fastify-plugin');
const fsPromises = require('node:fs').promises;
const { filePaths, FILES } = require('./filePaths');

const cache = {};

const isFileCached = (filesKey) => {
  return cache[filesKey]?.file != null;
};

async function fileCache (fastify, options) {
  const filePathMap = new Map([
    [FILES.HTML_INDEX, filePaths.public.files[FILES.HTML_INDEX]],
    [FILES.HTML_404, filePaths.public.files[FILES.HTML_404]]
  ]);

  for (const [k, v] of filePathMap) {
    if (isFileCached(k)) {
      console.error(`duplicate file caching: ${k} --- ${v}`);
      continue;
    }
    try {
      cache[k] = {
        key: k,
        path: v,
        file: null
      };

      cache[k].file = await fsPromises.readFile(v);

      if (cache[k] != null) {
        fastify.log.info(`[FILE] loaded: ${k}`);
      }
    } catch (error) {
      const errorMsg = `Failed to read file [${k}] at [${v}]: ${error.message}`;
      console.error(errorMsg);
      fastify.log.error(errorMsg);
    }
  }
}

module.exports = fp(fileCache, {
  name: 'fileCache',
  dependencies: [] // If there are dependencies, they can be added here
});
