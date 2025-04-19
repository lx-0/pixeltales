import fetch from 'node-fetch'; // Use the node-fetch package

const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:3000';
// Ensure no trailing slash on backendUrl before appending /health
const healthCheckUrl = `${backendUrl.replace(/\/$/, '')}/health`;

const MAX_RETRIES = 30; // 30 retries * 2 seconds = 60 seconds timeout
const RETRY_DELAY_MS = 2000;

let retries = 0;

console.log(`⏳ Waiting for backend at: ${healthCheckUrl}`);

async function checkBackend() {
  try {
    // Use { signal: AbortSignal.timeout(RETRY_DELAY_MS - 100) } for fetch timeout if needed
    const response = await fetch(healthCheckUrl, { method: 'GET' });
    if (response.ok) {
      // status >= 200 && status < 300
      console.log(`✅ Backend is healthy! (${response.status}) Starting frontend...`);
      process.exit(0); // Success
    } else {
      console.log(`🚦 Backend responded with status: ${response.status}. Retrying...`);
      retry();
    }
  } catch (error) {
    // Node fetch throws TypeError for network errors, check code for ECONNREFUSED
    if (error instanceof Error && 'code' in error && error.code === 'ECONNREFUSED') {
      console.log(`🔌 Connection refused. Backend likely still starting. Retrying...`);
    } else if (error instanceof Error) {
      console.log(`❓ Error connecting to backend: ${error.message}. Retrying...`);
    } else {
      console.log(`❓ Unknown error connecting to backend. Retrying...`);
    }
    retry();
  }
}

function retry() {
  retries++;
  if (retries > MAX_RETRIES) {
    console.error('❌ Backend did not become healthy after maximum retries. Exiting.');
    process.exit(1); // Failure
  }
  setTimeout(checkBackend, RETRY_DELAY_MS);
}

// Initial check
checkBackend();
