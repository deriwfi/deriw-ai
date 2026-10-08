#!/usr/bin/env node
require('./lib/operations').run('fund-deposit').catch(require('./lib/runtime').fail);
