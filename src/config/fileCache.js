'use strict';

const fsPromises = require('node:fs').promises;

const { paths, FILES } = require('./paths');

const fileCache = {
  html: {
    htmlIndex: {
      key: FILES.fileIndex,
      path: paths.public.files[FILES.fileIndex],
      file: null
    },
    html404: {
      key: FILES.file404,
      path: paths.public.files[FILES.file404],
      file: null
    }
  }
};

const loadFileCache = async (fastify) => {
  /* Index.html */
  try {
    fileCache.html.htmlIndex.file = await fsPromises.readFile(fileCache.html.htmlIndex.path);
    const { file, key } = fileCache.html.htmlIndex;
    if (file != null) {
      fastify.log.info(`[FILE] loaded: ${key}`);
    }
  } catch (error) {
    fastify.log.error(`Failed to read index.html file: ${error.message}`);
    process.exit(1);
  }

  /* 404.html */
  try {
    fileCache.html.html404.file = await fsPromises.readFile(fileCache.html.html404.path);
    const { file, key } = fileCache.html.html404;
    if (file != null) {
      fastify.log.info(`[FILE] loaded: ${key}`);
    }
  } catch (error) {
    fastify.log.error(`Failed to read 404.html file: ${error.message}`);
    process.exit(1);
  }
};

module.exports = {
  fileCache,
  loadFileCache
};
