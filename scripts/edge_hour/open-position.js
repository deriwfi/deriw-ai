#!/usr/bin/env node
require('../lib/operations').run('open-position').catch(require('../lib/runtime').fail);
