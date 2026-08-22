/**
 * Comprehensive Integration & Verification Test Suite for TX-77 AURA HMI
 */

const fs = require('fs');
const path = require('path');

// Mock DOM / Browser environment for node execution
global.window = global;
global.document = {
  getElementById: (id) => ({
    textContent: '',
    innerHTML: '',
    style: {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    addEventListener: () => {},
    setAttribute: () => {},
    querySelector: () => ({ textContent: '', style: {} }),
    querySelectorAll: () => [],
    appendChild: () => {},
    scrollTop: 0,
    scrollHeight: 0
  }),
  createElement: (tag) => ({
    className: '',
    innerHTML: '',
    style: {},
    querySelector: () => ({ addEventListener: () => {} }),
    querySelectorAll: () => [],
    appendChild: () => {},
    addEventListener: () => {}
  }),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// Load modules into global scope
const vm = require('vm');
const context = vm.createContext(global);

const audioCode = fs.readFileSync(path.join(__dirname, '../js/audio.js'), 'utf8');
vm.runInContext(audioCode, context);

const physicsCode = fs.readFileSync(path.join(__dirname, '../js/physics.js'), 'utf8');
vm.runInContext(physicsCode, context);

const presetsCode = fs.readFileSync(path.join(__dirname, '../js/presets.js'), 'utf8');
vm.runInContext(presetsCode, context);

const archiveCode = fs.readFileSync(path.join(__dirname, '../js/archive.js'), 'utf8');
vm.runInContext(archiveCode, context);

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('TX-77 AURA NUCLEAR REACTOR CRITICALITY HMI - VERIFICATION SUITE');
  console.log('===============================================================');

  const physics = new window.ReactorPhysicsEngine();
  window.reactorPhysics = physics;

  // Test 1: Cold Start State
  console.log('\n[TEST 1] Cold Start & Initial State Verification');
  assert(physics.state === 'SUBCRITICAL', 'Reactor state starts as SUBCRITICAL');
  assert(physics.keff === 0.7500, `Initial keff is 0.7500 (actual: ${physics.keff})`);
  assert(physics.thermalPowerMw === 0.001, `Initial thermal power is 0.001 MWth (actual: ${physics.thermalPowerMw})`);
  assert(physics.selectedSequence.length === 0, 'No channels calibrated initially');
  assert(physics.rpsHoldEngaged === false, 'RPS Hold MUST default to RELEASED (false)');

  // Test 2: Channel Count & Calibrated Address Length
  console.log('\n[TEST 2] Channel Geometry & Worth Calibration');
  assert(physics.channels.length === 10, 'Core has exactly 10 radial rod channels');
  assert(physics.maxAddressLength === 6, 'Full alignment address length is 6 channels');
  
  // Test 3: Manual Dialing & Flux Stabilization
  console.log('\n[TEST 3] Two-Part Channel Locking Sequence (Rod Withdrawal + Flux Stabilization)');
  const manualSequence = [0, 2, 4, 5, 7, 9]; // α, γ, ε, ζ, θ, κ
  for (let i = 0; i < manualSequence.length; i++) {
    const chId = manualSequence[i];
    const calib = physics.calibrateChannel(chId);
    assert(calib !== false, `Channel ${chId} started calibration`);
    assert(physics.channels[chId].isCalibrating === true, `Channel ${chId} isCalibrating is true`);
    
    // Simulate physics updates during withdrawal
    for (let f = 0; f < 10; f++) physics.update(0.05);

    // Confirm flux stabilization lock
    const locked = physics.confirmChannelLock(chId);
    assert(locked === true, `Channel ${chId} lock confirmed upon flux stabilization`);
    assert(physics.channels[chId].isCalibrated === true, `Channel ${chId} isCalibrated is true`);
    assert(physics.selectedSequence.length === i + 1, `Selected sequence length is now ${i + 1}`);
  }

  // Test 4: Negative Auto-Fire Test
  console.log('\n[TEST 4] Negative Auto-Fire Test (CRITICAL SAFETY CONSTRAINT)');
  physics.update(0.1);
  physics.update(0.1);
  assert(physics.state === 'PENDING', `State after 6th rod lock is PENDING (actual: ${physics.state})`);
  assert(physics.keff < 1.0, `System did NOT auto-fire into criticality (keff: ${physics.keff})`);
  assert(physics.thermalPowerMw < 1.0, `System power did NOT surge (power: ${physics.thermalPowerMw} MWth)`);

  // Test 5: RPS Interlock Safety Hold Check
  console.log('\n[TEST 5] Reactor Protection System (RPS) Hold Inhibit Test');
  physics.toggleRpsHold(); // Engage RPS Hold
  assert(physics.rpsHoldEngaged === true, 'RPS Hold is now ENGAGED');
  const blockedAttempt = physics.initiateActivation();
  assert(blockedAttempt.success === false && blockedAttempt.reason === 'RPS_INTERLOCK_ENGAGED', 
    'Criticality activation is blocked when RPS Hold is engaged');
  assert(physics.state === 'PENDING', 'State remains in PENDING when activation blocked');

  physics.toggleRpsHold(); // Release RPS Hold
  assert(physics.rpsHoldEngaged === false, 'RPS Hold returned to RELEASED');

  // Test 6: 3-Stage Staged Activation Lifecycle
  console.log('\n[TEST 6] Three-Stage Activation Lifecycle (Buildup -> Breakthrough -> Sustained)');
  const actRes = physics.initiateActivation();
  assert(actRes.success === true, 'Activation initiated successfully with RPS Hold clear');
  assert(physics.state === 'BUILDUP', 'State transitioned to Stage 1: BUILDUP');

  // Simulate Stage 1: Buildup (2.2s)
  for (let t = 0; t < 23; t++) physics.update(0.1);
  assert(physics.state === 'BREAKTHROUGH', 'State transitioned to Stage 2: BREAKTHROUGH');
  assert(physics.keff >= 0.999, `Stage 2 keff reached prompt critical threshold: ${physics.keff.toFixed(4)}`);

  // Simulate Stage 2: Breakthrough (1.5s)
  for (let t = 0; t < 16; t++) physics.update(0.1);
  assert(physics.state === 'SUSTAINED', 'State transitioned to Stage 3: SUSTAINED CRITICAL');
  assert(physics.keff >= 1.0000, `Stage 3 keff sustained at critical: ${physics.keff.toFixed(4)}`);
  assert(physics.thermalPowerMw >= 400.0, `Thermal power reached full steady-state: ${physics.thermalPowerMw.toFixed(1)} MWth`);

  // Test 7: Disengage 1 (Emergency SCRAM)
  console.log('\n[TEST 7] Disengage Cycle 1 (Emergency SCRAM)');
  physics.scram();
  physics.update(0.05);
  assert(physics.state === 'SUBCRITICAL', 'State returned to SUBCRITICAL after SCRAM');
  assert(physics.targetKeff === 0.7500, 'Target keff reset to 0.7500');
  assert(physics.selectedSequence.length === 0, 'Selected sequence cleared');
  physics.channels.forEach(ch => {
    assert(ch.isCalibrated === false && ch.isCalibrating === false, `${ch.bank} reset to uncalibrated`);
  });

  // Test 8: Quick-Dial Preset Auto-Sequencer & Negative Auto-Fire
  console.log('\n[TEST 8] Quick-Dial Presets & Stepped Auto-Sequencer');
  const presets = new PresetSequencer();
  const presetList = Object.keys(presets.presets);
  assert(presetList.length >= 6, `At least 6 presets available (count: ${presetList.length})`);
  
  const tier1Count = presetList.filter(k => presets.presets[k].tier.includes('Tier 1')).length;
  const tier2Count = presetList.filter(k => presets.presets[k].tier.includes('Tier 2')).length;
  assert(tier1Count >= 3 && tier2Count >= 3, `Presets span at least 2 distinct tiers (Tier 1: ${tier1Count}, Tier 2: ${tier2Count})`);

  // Execute Preset 'CRIT-B04'
  console.log('  Executing Quick-Dial preset CRIT-B04...');
  let autoDialComplete = false;
  presets.executePreset('CRIT-B04', null, () => {
    autoDialComplete = true;
  });

  // Wait for stepped async execution
  await new Promise(resolve => setTimeout(resolve, 5200));
  assert(autoDialComplete === true, 'Preset auto-sequencer finished all 6 steps');
  assert(physics.state === 'PENDING', `Preset auto-dial landed in PENDING state (actual: ${physics.state})`);
  assert(physics.selectedSequence.length === 6, 'Preset loaded 6 channels');
  assert(physics.keff < 1.0, 'Preset auto-dial did NOT auto-fire activation');

  // Test 9: Activation 2 & Disengage Cycle 2
  console.log('\n[TEST 9] Activation 2 & Disengage Cycle 2');
  physics.initiateActivation();
  assert(physics.state === 'BUILDUP', 'Second activation reached BUILDUP');
  for (let t = 0; t < 40; t++) physics.update(0.1);
  assert(physics.state === 'SUSTAINED', 'Second activation reached SUSTAINED');

  physics.scram();
  physics.update(0.05);
  assert(physics.state === 'SUBCRITICAL', 'Second SCRAM disengage successful');

  // Test 10: Xenon Transient & Archive Subsystems
  console.log('\n[TEST 10] Secondary Telemetry: Xenon-135 Model & Archive');
  assert(physics.xenon135 > 0, `Xenon-135 concentration computed: ${physics.xenon135.toExponential(2)}`);
  assert(physics.iodine135 > 0, `Iodine-135 concentration computed: ${physics.iodine135.toExponential(2)}`);
  
  const archive = new ConfigurationArchive();
  assert(archive.records.length >= 12, `Configuration archive contains ${archive.records.length} records (>= 12)`);

  // Test 11: Version & Model Attribution
  console.log('\n[TEST 11] Version & Model Attribution Verification');
  const versionFile = JSON.parse(fs.readFileSync(path.join(__dirname, '../version.json'), 'utf8'));
  assert(versionFile.version === '1.0.0', `version.json version is 1.0.0 (actual: ${versionFile.version})`);
  assert(versionFile.model === 'Gemini 3.7 Flash (High)', `version.json model is Gemini 3.7 Flash (High) (actual: ${versionFile.model})`);

  const changelog = fs.readFileSync(path.join(__dirname, '../CHANGELOG.md'), 'utf8');
  assert(changelog.includes('**Built by:** Gemini 3.7 Flash (High)'), 'CHANGELOG.md includes model attribution');

  console.log('\n===============================================================');
  console.log(`ALL TESTS PASSED: ${passed} / ${total} assertions verified!`);
  console.log('===============================================================');
}

runTests().catch(err => {
  console.error('\nTest Suite encountered an error:', err);
  process.exit(1);
});
