'use strict';
const { join, resolve } = require('node:path');
const fp = require('fastify-plugin');
const config = require('config');
const PLUGINS = require('../../data/json/plugins.json');

// Constants
const API_VERSION = config.get('api').name;
const ERROR_DUPLICATE = 'duplicate path entry in object.';
const _joinScriptPath = join(__dirname, __filename);
const _joinPublicPath = join(__dirname, '..', 'public');
const _joinSourcePath = join(__dirname, '..');
const scriptPath = resolve(_joinScriptPath);
const publicPath = resolve(_joinPublicPath);
const sourcePath = resolve(_joinSourcePath);

/**
 * Error Handling
 */
const onError = (err, source) => {
  console.error(`Error: [${err}] in ${source} in ${scriptPath}`);
  throw new Error(`${err} :: ${source} in ${scriptPath}`);
};

/**
 * Files & Directories
 */
const FILES = require('../../data/json/files.json');
const DIRECTORIES = require('../../data/json/directories.json');

// Path mappings
const publicFiles = new Map([
  [FILES.HTML_INDEX, FILES.HTML_INDEX],
  [FILES.HTML_404, FILES.HTML_404]
]);

const publicDirectories = new Map([
  [DIRECTORIES.publicDirCss, `./${DIRECTORIES.publicDirCss}`],
  [DIRECTORIES.publicDirImg, `./${DIRECTORIES.publicDirImg}`]
]);

const sourceDirectories = new Map([
  [DIRECTORIES.srcDirPlugins, `./${DIRECTORIES.srcDirPlugins}`],
  [DIRECTORIES.srcDirRoutes, `./${DIRECTORIES.srcDirRoutes}`],
  [DIRECTORIES.srcDirData, `./${DIRECTORIES.srcDirData}`],
  [DIRECTORIES.srcDirJson, `./${DIRECTORIES.srcDirData}/${DIRECTORIES.srcDirJson}`],
  [DIRECTORIES.srcDirModels, `./${DIRECTORIES.srcDirData}/${DIRECTORIES.srcDirModels}`],
  [DIRECTORIES.srcDirTemplates, `./${DIRECTORIES.srcDirData}/${DIRECTORIES.srcDirTemplates}`],
  [DIRECTORIES.srcDirApi, `./${DIRECTORIES.srcDirRoutes}/${API_VERSION}`]
]);

// Initialize paths object
const _paths = {
  public: {
    path: publicPath,
    pathPrefix: '/',
    directories: {},
    files: {}
  },
  src: {
    path: sourcePath,
    pathPrefix: './src/',
    directories: {},
    files: {}
  }
};

/**
 * Resolves and adds paths to the target object.
 *
 * @param {Object} options - Options for path resolution.
 * @param {string} options.basePath - Base path to resolve against.
 * @param {Map<string, string>} options.pathMap - Key-value pairs of paths to resolve.
 * @param {Object} options.targetObject - Object to add resolved paths to.
 * @param {string} options.pathType - Type of paths (e.g., 'file', 'directory').
 * @param {Object} fastify - Fastify instance for logging.
 * @throws {Error} Throws if a duplicate path is encountered.
 */
function resolveAndAddPath ({ basePath, pathMap, targetObject, pathType }, fastify) {
  for (const [key, relativePath] of pathMap) {
    const fullPath = join(basePath, relativePath);
    const resolvedPath = resolve(fullPath);

    if (key in targetObject) {
      const errorMessage = `Duplicate ${pathType} path: ${key}`;
      onError(ERROR_DUPLICATE, errorMessage);
    }

    fastify.log.info(`Loaded [${pathType.toUpperCase()}] path: ${resolvedPath}`);
    targetObject[key] = resolvedPath;
  }
}

function createOptions (basePath, pathMap, targetObject, pathType) {
  return {
    basePath,
    pathMap,
    targetObject,
    pathType
  };
}

async function filePaths (fastify, options) {
  // Resolve and add public files
  resolveAndAddPath(createOptions(publicPath, publicFiles, _paths.public.files, 'public-file'), fastify);

  // Resolve and add public directories
  resolveAndAddPath(createOptions(publicPath, publicDirectories, _paths.public.directories, 'public-directory'), fastify);

  // Resolve and add source directories
  resolveAndAddPath(createOptions(sourcePath, sourceDirectories, _paths.src.directories, 'source-directory'), fastify);

  /**
   * @ Decorate
   */
  // Decorate fastify instance with filePaths
  fastify.decorate(PLUGINS.filePaths.options.name, _paths);
}

module.exports = fp(filePaths, PLUGINS.filePaths.options);
