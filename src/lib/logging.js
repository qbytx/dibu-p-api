'use strict';

const loggingOptions = {
  logger: {
    level: 'info', // Set the logging level
    transport: {
      target: 'pino-pretty', // Use pino-pretty for human-readable logs
      options: {
        colorize: true, // Enable colorized output
        translateTime: 'SYS:standard', // Format the timestamp
        ignore: 'pid,hostname' // Ignore these fields
      }
    },
    serializers: {
      // Custom serializer for request logging
      req: (req) => {
        return {
          method: req.method,
          url: req.url,
          headers: req.headers
          // can add more fields if i want
        };
      }
    },
    formatters: {
      log (object) {
        // stack trace
        // const stack = new Error().stack;
        // const lineInfo = stack.split('\n')[3].trim(); // Adjust index based on the depth of your stack
        // const fileInfo = lineInfo.match(/\((.*?):(\d+):(\d+)\)/); // Regex to extract file name and line number

        // if (fileInfo) {
        //   const [file, line] = fileInfo; // Destructure the matched groups
        //   object.file = file;
        //   object.line = line;
        // }

        return object;
      }
    }
  }
};

module.exports = { loggingOptions };
