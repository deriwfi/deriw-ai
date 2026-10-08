#!/usr/bin/env node
require('./lib/operations').run('limit-open').catch(require('./lib/runtime').fail);
