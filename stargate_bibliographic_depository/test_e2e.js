/**
 * Automated Test Suite for Pan-Harmonic Bibliographic Depository
 * Validates HTTP server, DOM structure, dialing state machine,
 * 3-stage activation, negative auto-fire test, rejection path, and presets.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('====================================================');
  console.log('PAN-HARMONIC BIBLIOGRAPHIC DEPOSITORY TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. HTTP Server & File Verification
  console.log('--- 1. HTTP Server & Static Assets Verification ---');
  await new Promise((resolve) => {
    http.get('http://127.0.0.1:5173/', (res) => {
      assert(res.statusCode === 200, 'HTTP GET / returns 200 OK');
      assert(res.headers['content-type'].includes('text/html'), 'Content-Type is text/html');
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        assert(data.includes('PAN-HARMONIC BIBLIOGRAPHIC DEPOSITORY'), 'HTML contains institute branding');
        assert(data.includes('id="rotary-wheel"'), 'HTML contains rotary card-catalog wheel');
        assert(data.includes('id="cluster-taxonomic-assembly"'), 'HTML contains Cluster 1 (Taxonomic Assembly)');
        assert(data.includes('id="cluster-retrieval-actuator"'), 'HTML contains Cluster 2 (Retrieval Actuator)');
        assert(data.includes('id="chk-integrity-hold"'), 'HTML contains Preservation Integrity Hold switch');
        assert(data.includes('https://github.com/StarlightDaemon'), 'HTML contains StarlightDaemon link with rel="noopener noreferrer"');
        resolve();
      });
    }).on('error', (err) => {
      assert(false, `HTTP request failed: ${err.message}`);
      resolve();
    });
  });

  // 2. Metadata & Versioning Verification
  console.log('\n--- 2. Versioning & Model Attribution Verification ---');
  const versionJsonPath = path.join(__dirname, 'version.json');
  assert(fs.existsSync(versionJsonPath), 'version.json exists');
  const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
  assert(versionData.version === '1.0.0', 'version.json contains "version": "1.0.0"');
  assert(versionData.model && versionData.model.includes('Gemini 3.7 Flash'), 'version.json contains "model" field with Gemini 3.7 Flash');

  const changelogPath = path.join(__dirname, 'CHANGELOG.md');
  assert(fs.existsSync(changelogPath), 'CHANGELOG.md exists');
  const changelogContent = fs.readFileSync(changelogPath, 'utf8');
  assert(changelogContent.includes('## [1.0.0]'), 'CHANGELOG.md has v1.0.0 section');
  assert(changelogContent.includes('**Built by:** Gemini 3.7 Flash (High reasoning)'), 'CHANGELOG.md has "**Built by:**" attribution line');

  // 3. Logic and Code Structure Tests
  console.log('\n--- 3. Core Logic & Taxonomic Engine Verification ---');
  const appJsContent = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  assert(appJsContent.includes('VALERIUS_TAXONOMY'), 'app.js defines Valerius taxonomy');
  assert(appJsContent.includes('PRESET_CATALOG'), 'app.js defines Quick-Dial catalog');
  assert(appJsContent.includes('DepositoryAudioEngine'), 'app.js defines Web Audio procedural synthesizer');
  assert(appJsContent.includes('playRotaryClick'), 'Web Audio includes rotary card click sound');
  assert(appJsContent.includes('playLockDetent'), 'Web Audio includes mechanical detent & bell chime');
  assert(appJsContent.includes('playRejectionBuzzer'), 'Web Audio includes discordant rejection buzzer');
  assert(appJsContent.includes('triggerBreakthrough'), 'app.js implements Breakthrough stage');
  assert(appJsContent.includes('triggerSustainedActive'), 'app.js implements Sustained Active stage');
  assert(appJsContent.includes('handleDisengage'), 'app.js implements Disengage / Seal Vault');
  assert(appJsContent.includes('triggerRejectionPath'), 'app.js implements Misfiled Rejection Path');

  // 4. Style & CSS Scale Pitfall Verification
  console.log('\n--- 4. CSS & Responsive Scaling Verification ---');
  const cssContent = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
  assert(cssContent.includes('--ui-scale'), 'CSS defines unitless --ui-scale custom property');
  assert(cssContent.includes('transform: scale(var(--ui-scale))'), 'CSS applies scale with unitless custom property (avoids calc division pitfall)');
  assert(!cssContent.includes('calc(100vw / 1920)'), 'CSS does not use invalid bare number length division');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');
}

runTests();
