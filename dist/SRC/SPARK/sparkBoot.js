// SPARK Boot Script — starts runtime kernel loop
import { SparkCore } from './sparkCore.js';
function idGen() { return crypto.randomUUID(); }
function clock() { return new Date().toISOString(); }
async function main() {
    const core = new SparkCore(idGen, clock, { tickIntervalMs: 60_000 });
    await core.init();
    console.log('[SPARK] Core initialized');
    const runTick = () => {
        const nowTs = clock();
        const date = nowTs.slice(0, 10); // YYYY-MM-DD
        const summary = core.tick(date);
        console.log('[SPARK] Tick summary:', JSON.stringify(summary));
    };
    if (process.env.SPARK_ONCE) {
        runTick();
        await core.shutdown();
        console.log('[SPARK] Shutdown complete');
        return;
    }
    // Initial tick
    runTick();
    const intervalMs = core['cfg'].tickIntervalMs || 60_000;
    const handle = setInterval(runTick, intervalMs);
    const shutdown = async () => {
        clearInterval(handle);
        console.log('\n[SPARK] Shutting down...');
        await core.shutdown();
        console.log('[SPARK] Shutdown complete');
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
main().catch(err => {
    console.error('[SPARK] Fatal startup error', err);
    process.exit(1);
});
