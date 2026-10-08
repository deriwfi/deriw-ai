#!/usr/bin/env node
require('./lib/user-actions').run().catch(require('./lib/runtime').fail);
