#!/usr/bin/env node
require('../lib/operations').run('start-challenge').catch(require('../lib/runtime').fail);
