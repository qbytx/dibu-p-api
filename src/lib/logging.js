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
    // Custom serializer to include the line number in the log
      req: (req) => {
        return {
          method: req.method,
          url: req.url,
          headers: req.headers,
          // Add more fields as needed
          line: (new Error()).stack.split('\n')[2] // Get the line number
        };
      }
    }
  }
};

module.exports = { loggingOptions };
