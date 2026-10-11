import { ShardingManager } from 'discord.js';
import { fileURLToPath } from 'url';
import { LogData, Log } from './shared/utils/logger.js';
import { ENV } from './bootstrap/environment.js';

Log('Mushroom Discord Bot | Created by: @Dexvo');
if (ENV.DEVELOPER_MODE) LogData('Developer Mode Enabled', 'The bot is running in Developer Mode.', 'warning');

const token = ENV.DEVELOPER_MODE ? ENV.BOT_TOKEN_DEV : ENV.BOT_TOKEN;

// Shards get FORCE_EXIT_MS (10s) to shut down themselves; give them a little longer here
const SHARD_SHUTDOWN_TIMEOUT_MS = 15_000;

let shuttingDown = false;

const ShardManager = new ShardingManager(fileURLToPath(new URL('./bootstrap/client.js', import.meta.url)), {
    token: token,
    totalShards: 'auto',
});

ShardManager.on('shardCreate', (shard) => {
    LogData('Shard Spawned', `Shard ${shard.id} has been spawned.`, 'info');
    shard.on('ready', () => {
        LogData('Shard Ready', `Shard ${shard.id} is ready.`, 'success');
    });
    shard.on('disconnect', () => {
        LogData('Shard Disconnected', `Shard ${shard.id} has disconnected.`, 'warning');
    });
    shard.on('reconnecting', () => {
        LogData('Shard Reconnecting', `Shard ${shard.id} is reconnecting.`, 'info');
    });
    shard.on('death', () => {
        if (shuttingDown) LogData('Shard Stopped', `Shard ${shard.id} has shut down.`, 'info');
        else LogData('Shard Died', `Shard ${shard.id} has died.`, 'error');
    });
});

ShardManager.spawn().catch((error) => {
    LogData('Shard Spawn Error', 'An error occurred while spawning shards.', 'error');
    console.error(error);
});

/**
 * Asks every shard to shut down cleanly (saving XP, closing the database) and waits for them.
 * Shard.kill() would terminate them immediately, so the request goes over IPC instead.
 * @param {string} signal
 */
async function shutdownShards(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    LogData('Shutdown Initiated', `Received ${signal}. Stopping ${ShardManager.shards.size} shard(s)...`, 'warning');

    // Stop the manager from respawning shards as they exit
    ShardManager.respawn = false;

    const running = [...ShardManager.shards.values()].filter((shard) => shard.process);
    const stopped = running.map(
        (shard) =>
            new Promise((resolve) => {
                shard.once('death', resolve);
                shard.send({ type: 'shutdown' }).catch(resolve); // Already gone
            })
    );

    const timedOut = await Promise.race([
        Promise.all(stopped).then(() => false),
        new Promise((resolve) => setTimeout(() => resolve(true), SHARD_SHUTDOWN_TIMEOUT_MS)),
    ]);

    if (timedOut) {
        LogData('Shutdown', 'Some shards did not stop in time, killing them.', 'error');
        for (const shard of running) shard.kill();
    }

    LogData('Shutdown', 'All shards stopped.', 'success');
    process.exit(timedOut ? 1 : 0);
}

process.on('SIGINT', () => shutdownShards('SIGINT')); // CTRL+C in terminal
process.on('SIGTERM', () => shutdownShards('SIGTERM')); // Docker/PM2 stop commands
