'use strict';

const { join, resolve } = require('node:path');

const API_VERSION = 'v1';
const ERROR_DUPLICATE = 'duplicate path entry in object.';
const scriptPath = resolve(join(__dirname, __filename));
const publicPath = resolve(join(__dirname, '..', 'public'));
const sourcePath = resolve(join(__dirname, '../'));

const onError = (err, source) => {
  console.error(`Error: [${err}] in ${source} in ${scriptPath}`);
  throw new Error(`${err} :: ${source} in ${scriptPath}`);
};

const FILES = Object.freeze({
  fileIndex: 'index.html',
  file404: '404.html'
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

/* Define object export */

const paths = {
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

/* Define mappings of public files */

const publicFiles = new Map([
  [FILES.fileIndex, FILES.fileIndex],
  [FILES.file404, FILES.file404]
]);

/* Define mappings of public directories */

const publicDirectories = new Map([
  [DIRECTORIES.publicDirCss, `./${DIRECTORIES.publicDirCss}`],
  [DIRECTORIES.publicDirImg, `./${DIRECTORIES.publicDirImg}`]
]);

/* Define mappings of source directories */

const sourceDirectories = new Map([
  [DIRECTORIES.srcDirPlugins, `./${DIRECTORIES.srcDirPlugins}`],
  [DIRECTORIES.srcDirRoutes, `./${DIRECTORIES.srcDirRoutes}`],
  [DIRECTORIES.srcDirData, `./${DIRECTORIES.srcDirData}`],
  [DIRECTORIES.srcDirJson, `./${DIRECTORIES.srcDirData}/${DIRECTORIES.srcDirJson}`],
  [DIRECTORIES.srcDirModels, `./${DIRECTORIES.srcDirData}/${DIRECTORIES.srcDirModels}`],
  [DIRECTORIES.srcDirTemplates, `./${DIRECTORIES.srcDirData}/${DIRECTORIES.srcDirTemplates}`],
  [DIRECTORIES.srcDirApi, `./${DIRECTORIES.srcDirRoutes}/${API_VERSION}`]
]);

/*
 * Resolve [PUBLIC FILE] paths and check for duplicates.
 * Store resolved paths in the paths object.
 */

for (const [k, v] of publicFiles) {
  const fileName = k;
  const filePath = v;
  const resolvedPath = resolve(join(publicPath, filePath));

  if (paths.public.files[fileName] != null) {
    onError(ERROR_DUPLICATE, 'public-files');
  } else {
    console.log(`Loaded [FILE] path: ${resolvedPath}`);
    paths.public.files[fileName] = resolvedPath;
  }
}

/*
 * Resolve [PUBLIC DIRECTORY] paths and check for duplicates.
 * Store resolved paths in the paths object.
 */

for (const [k, v] of publicDirectories) {
  const dirName = k;
  const dirPath = v;
  const resolvedPath = resolve(join(publicPath, dirPath));

  if (paths.public.directories[dirName] != null) {
    onError(ERROR_DUPLICATE, 'public-directories');
  } else {
    console.log(`Loaded [PUBLIC] path: ${resolvedPath}`);
    paths.public.directories[dirName] = resolvedPath;
  }
}

/*
 * Resolve [SOURCE DIRECTORY] paths and check for duplicates.
 * Store resolved paths in the paths object.
 */

for (const [k, v] of sourceDirectories) {
  const dirName = k;
  const dirPath = v;
  const resolvedPath = resolve(join(sourcePath, dirPath));

  if (paths.src.directories[dirName] != null) {
    onError(ERROR_DUPLICATE, 'source-directories');
  } else {
    console.log(`Loaded [SOURCE] path: ${resolvedPath}`);
    paths.src.directories[dirName] = resolvedPath;
  }
}

module.exports = {
  paths,
  FILES,
  DIRECTORIES
};
