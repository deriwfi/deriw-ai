#!/usr/bin/env node
require('../lib/operations').run('claim-reward').catch(require('../lib/runtime').fail);
