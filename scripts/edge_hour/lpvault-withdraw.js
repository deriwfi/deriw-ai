#!/usr/bin/env node
require('../lib/operations').run('lpvault-withdraw').catch(require('../lib/runtime').fail);
