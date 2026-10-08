#!/usr/bin/env node
require('./lib/operations').run('limit-close').catch(require('./lib/runtime').fail);
