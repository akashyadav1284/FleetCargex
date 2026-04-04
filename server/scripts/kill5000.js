const { execSync } = require('child_process');
try {
  const output = execSync('netstat -ano | findstr :5000', { encoding: 'utf8' });
  output.split('\n').forEach(line => {
    if (line.includes('LISTENING')) {
      const pid = line.trim().split(/\s+/)[4];
      if (pid) {
        console.log(`Killing PID ${pid}`);
        process.kill(parseInt(pid, 10), 'SIGTERM');
      }
    }
  });
} catch (e) {
  console.log('No process found or error killing it.');
}
