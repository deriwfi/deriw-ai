#!/usr/bin/env node
require('../lib/operations').run('lpvault-deposit').catch(require('../lib/runtime').fail);
