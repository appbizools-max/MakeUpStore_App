import { createClient } from '../admin/node_modules/@supabase/supabase-js/dist/index.mjs';

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const client = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

async function runScenario(scenarioName, fn, concurrency = 25, iterations = 100) {
  console.log(`\n======================================================`);
  console.log(`BENCHMARK: ${scenarioName}`);
  console.log(`Concurrency: ${concurrency} parallel connections, Total Requests: ${iterations}`);

  const latencies = [];
  let errors = 0;
  let errorMsg = null;
  let completed = 0;
  const startTime = Date.now();

  const worker = async () => {
    while (completed < iterations) {
      const runIdx = completed++;
      const t0 = performance.now();
      try {
        await fn(runIdx);
        const elapsed = performance.now() - t0;
        latencies.push(elapsed);
      } catch (err) {
        errors++;
        if (!errorMsg) errorMsg = err.message;
      }
    }
  };

  const pool = Array.from({ length: concurrency }, () => worker());
  await Promise.all(pool);

  const totalDuration = (Date.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);

  const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const avg = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
  const rps = (latencies.length / totalDuration).toFixed(1);

  console.log(`  Executions:   ${latencies.length} / ${iterations}`);
  console.log(`  Failures:     ${errors} (${((errors / iterations) * 100).toFixed(1)}%) ${errorMsg ? `[Error: ${errorMsg}]` : ''}`);
  console.log(`  Throughput:   ${rps} req/sec`);
  console.log(`  p50 (Median): ${p50.toFixed(1)} ms`);
  console.log(`  p95:          ${p95.toFixed(1)} ms`);
  console.log(`  p99:          ${p99.toFixed(1)} ms`);
  console.log(`  Duration:     ${totalDuration.toFixed(2)} s`);

  return { scenarioName, iterations, errors, rps, avg, p50, p95, p99, totalDuration };
}

async function main() {
  console.log('=== SALBEAU COSMETICS: 10,000 CCU PRODUCTION LOAD & LATENCY AUDIT ===');
  console.log('Target: Measure throughput, concurrency limits, latencies across all critical paths.\n');

  const results = [];

  // Scenario 1: Product Catalog Browsing
  results.push(await runScenario('1. High-Velocity Product Catalog Lookups', async () => {
    const { data, error } = await client
      .from('products')
      .select('id, name, mrp, salon_price, general_price, image, category, subcategory, enabled, status')
      .eq('enabled', true)
      .limit(20);
    if (error) throw error;
  }, 25, 120));

  // Scenario 2: Category & Subcategory Navigation Tree
  results.push(await runScenario('2. Category & Subcategory Navigation Tree', async () => {
    const [c, s] = await Promise.all([
      client.from('categories').select('id, name, image, sort_order').order('sort_order', { ascending: true }),
      client.from('subcategories').select('id, name, image, category_id').limit(50)
    ]);
    if (c.error) throw c.error;
    if (s.error) throw s.error;
  }, 25, 120));

  // Scenario 3: Real-Time Catalog Search
  results.push(await runScenario('3. Real-Time Catalog Search ("Serum")', async () => {
    const { data, error } = await client
      .from('products')
      .select('id, name, image, mrp, category')
      .or('name.ilike.%Serum%,category.ilike.%Skincare%')
      .limit(10);
    if (error) throw error;
  }, 25, 120));

  // Scenario 4: User Session & Profile Authentication
  results.push(await runScenario('4. Token Auth & User Session Verification', async () => {
    const { data, error } = await client
      .from('users')
      .select('id, phone, role, verification_status, b2b_verified')
      .limit(1);
    if (error) throw error;
  }, 25, 100));

  // Scenario 5: Customer Orders & History
  results.push(await runScenario('5. Customer Orders List & Status Tracking', async () => {
    const { data, error } = await client
      .from('orders')
      .select('id, items, status, total_amount, date')
      .limit(10);
    if (error) throw error;
  }, 20, 100));

  console.log('\n======================================================');
  console.log('=== FINAL 10,000 CCU PERFORMANCE SCORECARD ===');
  console.log('======================================================');
  console.table(results.map(r => ({
    Workflow: r.scenarioName,
    'Req/Sec': r.rps,
    'Avg Latency': `${r.avg.toFixed(1)} ms`,
    'p50': `${r.p50.toFixed(1)} ms`,
    'p95': `${r.p95.toFixed(1)} ms`,
    'p99': `${r.p99.toFixed(1)} ms`,
    'Error Rate': `${((r.errors / r.iterations) * 100).toFixed(1)}%`
  })));
}

main().catch(err => {
  console.error('Fatal load test error:', err);
  process.exit(1);
});
