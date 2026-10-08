#!/usr/bin/env node
require('./lib/operations').run('market-close').catch(require('./lib/runtime').fail);
