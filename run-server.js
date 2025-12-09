const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');

let restarting = false;
let restartDelay = 1000; // ms
let restartCount = 0;
const maxRestarts = 20; // avoid infinite tight-loop

function start() {
  const child = spawn(process.execPath, [serverPath], { stdio: 'inherit' });

  child.on('exit', (code, signal) => {
    if (restarting) return;
    restarting = true;
    restartCount += 1;
    console.error(`server.js exited with code=${code} signal=${signal}. Restarting (#${restartCount}) in ${restartDelay}ms...`);

    if (restartCount > maxRestarts) {
      console.error('Max restart attempts reached. Not restarting automatically anymore.');
      process.exit(code || 1);
      return;
    }

    setTimeout(() => {
      restarting = false;
      start();
    }, restartDelay);
  });

  child.on('error', (err) => {
    console.error('Failed to start server.js:', err);
    process.exit(1);
  });
}

start();
