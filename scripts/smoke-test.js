const http = require('http');

async function testEndpoint(name, url, expectedStatusList, maxTime = 10000, bodyCheck = null) {
  console.log(`\x1b[1;34m[SmokeTester] Testing ${name} at ${url}...\x1b[0m`);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => { controller.abort(); }, maxTime);
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!expectedStatusList.includes(res.status)) {
      console.error(`\x1b[1;31m[SmokeTester] FAIL: ${name} returned unexpected status code: ${res.status} (Expected ${expectedStatusList.join(', ')})\x1b[0m`);
      process.exit(1);
    }
    
    const text = await res.text();
    
    if (bodyCheck) {
      if (!bodyCheck(text)) {
         console.error(`\x1b[1;31m[SmokeTester] FAIL: ${name} payload did not match requirements: ${text}\x1b[0m`);
         process.exit(1);
      }
    }
    
    console.log(`\x1b[1;32m[SmokeTester] PASS: ${name} returned HTTP status ${res.status}\x1b[0m`);
  } catch (err) {
    console.error(`\x1b[1;31m[SmokeTester] FAIL: Failed to connect to ${name}: ${err.message}\x1b[0m`);
    process.exit(1);
  }
}

async function run() {
  const target = process.argv[2] || "http://localhost:3000";
  
  await testEndpoint("root page", target, [200, 302, 307], 10000);
  
  await testEndpoint("API Health", `${target}/api/health`, [200], 5000, (text) => text.includes('"status":"healthy"') || text.includes('"status": "healthy"'));
  
  await testEndpoint("metadata details", `${target}/api/info`, [200, 404, 401], 5000);
  
  console.log("===================================================");
  console.log("\x1b[1;32m[SmokeTester] DEPLOYMENT SMOKE TEST SUCCESSFUL. Target is stable.\x1b[0m");
  console.log("===================================================");
}

run();
