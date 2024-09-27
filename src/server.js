/*
    [A Happy Note]
    If you are using Node.js version 15+, 
    the correct promise behaviour is already implemented 
    and Node.js will safely behave on unhandled rejections 
    similarly to its uncaught exception behaviour. 
    If you are only using Node.js v15+ there is no need to use this module.

    If you need to support older versions of 
    Node.js - it is a good idea to use this module 
    to ensure future compatibility with modern Node.js 
    versions where the safe behaviour is the default one.
*/

import 'make-promises-safe';
import Fastify from 'fastify';
import App from './app.js';

async function start () {
    
    const fastify = Fastify({
      trustProxy: true,
      logger: { level: 'info' }
    });

    await fastify.register(App);

    const port = process.env.PORT || 4001;

    await fastify.listen({ port }, function (err, address) {
        if (err) {
            fastify.log.error(err);
            console.error(err);
            process.exit(1);
        }
    });
}
  
start().catch(err => {
    console.error(err)
    process.exit(1)
});