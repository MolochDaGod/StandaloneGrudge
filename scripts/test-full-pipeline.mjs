/**
 * E2E Test: Puter ID → Grudge ID → Auto Wallet → Cloud Sync
 * Tests the full player pipeline for friendly_wheel_2615
 *
 * Usage: node scripts/test-full-pipeline.mjs [BASE_URL]
 */

const BASE = process.argv[2] || 'https://grudgewarlords.com';
const PUTER_USERNAME = 'friendly_wheel_2615';

const log = (icon, msg) => console.log(`${icon}  ${msg}`);
const pass = (msg) => log('✅', msg);
const fail = (msg) => log('❌', msg);
const info = (msg) => log('ℹ️', msg);
const divider = () => console.log('─'.repeat(60));

async function fetchJSON(path, opts = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts.headers },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  console.log(`\n🔗 Testing against: ${BASE}`);
  console.log(`👤 Player: ${PUTER_USERNAME}\n`);

  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Puter Auth → Grudge ID + Auto Wallet
  // ═══════════════════════════════════════════════════════════════
  divider();
  info('STEP 1: POST /api/auth/puter');
  
  const auth = await fetchJSON('/api/auth/puter', {
    method: 'POST',
    body: JSON.stringify({ puterUsername: PUTER_USERNAME }),
  });

  if (!auth.ok) {
    fail(`Auth failed: HTTP ${auth.status} - ${JSON.stringify(auth.data)}`);
    return;
  }

  const { sessionToken, user, wallet } = auth.data;

  if (sessionToken) pass(`Session token received (${sessionToken.length} chars)`);
  else fail('No session token!');

  if (user?.grudgeId) pass(`Grudge ID: ${user.grudgeId}`);
  else fail('No Grudge ID returned!');

  if (user?.id) pass(`Account ID: ${user.id}`);
  if (user?.grudgeUsername) pass(`Grudge Username: ${user.grudgeUsername}`);
  if (user?.authType === 'puter') pass(`Auth type: puter`);

  if (wallet) {
    if (wallet.address) pass(`Wallet auto-created: ${wallet.address} (${wallet.chain})`);
    if (wallet.existing) info('Wallet already existed');
  } else {
    info('No wallet returned (CROSSMINT_SERVER_API_KEY may not be set)');
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Verify Session Token
  // ═══════════════════════════════════════════════════════════════
  divider();
  info('STEP 2: POST /api/auth/verify');

  const verify = await fetchJSON('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ sessionToken }),
  });

  if (verify.ok && verify.data.valid) {
    pass(`Session valid - accountId: ${verify.data.accountId}, grudgeId: ${verify.data.grudgeId}`);
  } else {
    fail(`Session verify failed: ${JSON.stringify(verify.data)}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 3: Check Wallet Status
  // ═══════════════════════════════════════════════════════════════
  divider();
  info('STEP 3: GET /api/wallet/status');

  const walletStatus = await fetchJSON('/api/wallet/status', {
    headers: { 'X-Session-Token': sessionToken },
  });

  if (walletStatus.ok) {
    if (walletStatus.data.hasWallet) {
      pass(`Wallet confirmed: ${walletStatus.data.wallet.address}`);
    } else {
      info('No wallet on account (Crossmint not configured on server)');
    }
  } else {
    fail(`Wallet status failed: ${JSON.stringify(walletStatus.data)}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 4: Cloud Sync Push
  // ═══════════════════════════════════════════════════════════════
  divider();
  info('STEP 4: POST /api/studio/sync/push');

  const testGameState = {
    playerName: PUTER_USERNAME,
    playerRace: 'human',
    playerClass: 'warrior',
    level: 5,
    gold: 1250,
    heroRoster: [
      { id: 'test-hero-1', name: 'TestHero', classId: 'warrior', raceId: 'human', level: 5 },
    ],
    victories: 12,
    losses: 3,
    _testTimestamp: Date.now(),
  };

  const push = await fetchJSON('/api/studio/sync/push', {
    method: 'POST',
    headers: { 'X-Session-Token': sessionToken },
    body: JSON.stringify({ gameState: testGameState }),
  });

  if (push.ok && push.data.success) {
    pass(`Cloud push OK - accountId: ${push.data.accountId}, timestamp: ${push.data.timestamp}`);
    if (push.data.puter?.ok) pass('Puter KV dual-write succeeded');
    else info(`Puter KV: ${push.data.puter?.reason || push.data.puter?.error || 'not available'}`);
  } else {
    fail(`Cloud push failed: ${JSON.stringify(push.data)}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 5: Cloud Sync Pull
  // ═══════════════════════════════════════════════════════════════
  divider();
  info('STEP 5: POST /api/studio/sync/pull');

  const pull = await fetchJSON('/api/studio/sync/pull', {
    method: 'POST',
    headers: { 'X-Session-Token': sessionToken },
  });

  if (pull.ok) {
    const src = pull.data.source;
    if (pull.data.data) {
      pass(`Cloud pull OK - source: ${src}`);
      const gs = pull.data.data.gameState || pull.data.data;
      if (gs.playerName) info(`  playerName: ${gs.playerName}`);
      if (gs._testTimestamp) info(`  testTimestamp matches: ${gs._testTimestamp === testGameState._testTimestamp}`);
    } else {
      info('Pull returned empty (no cloud save yet)');
    }
  } else {
    fail(`Cloud pull failed: ${JSON.stringify(pull.data)}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 6: Platform Status
  // ═══════════════════════════════════════════════════════════════
  divider();
  info('STEP 6: GET /api/studio/status');

  const status = await fetchJSON('/api/studio/status');
  if (status.ok) {
    const s = status.data.services;
    pass(`Platform: ${status.data.platform} v${status.data.version}`);
    info(`  DB: ${s.database.available ? 'OK' : 'DOWN'}`);
    info(`  ObjectStore: ${s.objectStore.available ? `OK (${s.objectStore.datasets} datasets)` : 'DOWN'}`);
    info(`  Puter: ${s.puter.available ? 'OK' : s.puter.mode || 'unavailable'}`);
    info(`  AI Agents: ${s.ai.agents}`);
  } else {
    fail('Platform status unavailable');
  }

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  divider();
  console.log('\n📋 PIPELINE SUMMARY:');
  console.log(`   Puter Username: ${PUTER_USERNAME}`);
  console.log(`   Grudge ID:      ${user?.grudgeId || 'MISSING'}`);
  console.log(`   Account ID:     ${user?.id || 'MISSING'}`);
  console.log(`   Wallet:         ${wallet?.address || walletStatus?.data?.wallet?.address || 'Not created (needs CROSSMINT_SERVER_API_KEY)'}`);
  console.log(`   Cloud Sync:     ${push.ok ? 'Push OK' : 'Push FAIL'} / ${pull.ok ? 'Pull OK' : 'Pull FAIL'}`);
  console.log(`   Session:        ${verify.ok ? 'Valid' : 'Invalid'}`);
  console.log('');
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
