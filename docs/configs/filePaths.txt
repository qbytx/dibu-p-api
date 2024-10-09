'use strict';
const { join, resolve } = require('node:path');
const config = require('config');

// Constants
const API_VERSION = config.get('api').name;
const ERROR_DUPLICATE = 'duplicate path entry in object.';
const _joinScriptPath = join(__dirname, __filename);
const _joinPublicPath = join(__dirname, '..', 'public');
const _joinSourcePath = join(__dirname, '..');
const scriptPath = resolve(_joinScriptPath);
const publicPath = resolve(_joinPublicPath);
const sourcePath = resolve(_joinSourcePath);

// Error handling
const onError = (err, source) => {
  console.error(`Error: [${err}] in ${source} in ${scriptPath}`);
  throw new Error(`${err} :: ${source} in ${scriptPath}`);
};

// Frozen objects for files and directories
const FILES = Object.freeze({
  HTML_INDEX: 'index.html',
  HTML_404: '404.html'
});

const DIRECTORIES = Object.freeze({
  publicDirCss: 'css',
  publicDirImg: 'img',
  srcDirPlugins: 'plugins',
  srcDirRoutes: 'routes',
  srcDirData: 'data',
  srcDirJson: 'json',
  srcDirModels: 'models',
  srcDirTemplates: 'templates',
  srcDirApi: API_VERSION
});

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
const filePaths = {
  public: { path: publicPath, pathPrefix: '/', directories: {}, files: {} },
  src: { path: sourcePath, pathPrefix: './src/', directories: {}, files: {} }
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

const loadFilePaths = async (fastify) => {
  // Resolve and add public files
  resolveAndAddPath(createOptions(publicPath, publicFiles, filePaths.public.files, 'public-file'), fastify);

  // Resolve and add public directories
  resolveAndAddPath(createOptions(publicPath, publicDirectories, filePaths.public.directories, 'public-directory'), fastify);

  // Resolve and add source directories
  resolveAndAddPath(createOptions(sourcePath, sourceDirectories, filePaths.src.directories, 'source-directory'), fastify);
};

module.exports = {
  loadFilePaths,
  filePaths,
  FILES,
  DIRECTORIES
};
