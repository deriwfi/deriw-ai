#!/usr/bin/env node
require('./lib/operations').run('market-open').catch(require('./lib/runtime').fail);
