const { spawnSync } = require('child_process');
const path = require('path');

const suites = [
  'test.js',
  'lgtest.js',
  'futest.js',
  'flagtest.js',
  'fbtest.js',
  'readtest.js',
  'asktest.js',
  'finaltest.js',
  'audit.js'
];

let failed = false;
for (const suite of suites) {
  console.log(`\n=== ${suite} ===`);
  const result = spawnSync(process.execPath, [path.join(__dirname, suite)], {
    stdio: 'inherit'
  });
  if (result.status !== 0) failed = true;
}

process.exit(failed ? 1 : 0);
