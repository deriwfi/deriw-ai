#!/usr/bin/env node
require('../lib/operations').run('close-position').catch(require('../lib/runtime').fail);
