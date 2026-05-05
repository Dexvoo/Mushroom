import { ShardingManager, EmbedBuilder, Colors } from 'discord.js';
import { LogData, Log } from './src/utils/logger.js';
import { ENV } from './src/core/env.js';

Log('Mushroom Discord Bot | Created by: @Dexvo');
if(ENV.DEVELOPER_MODE) LogData('Developer Mode Enabled', 'The bot is running in Developer Mode.', 'warning');


const token = ENV.DEVELOPER_MODE ? ENV.BOT_TOKEN_DEV : ENV.BOT_TOKEN;

const ShardManager = new ShardingManager('./src/bot.js', {
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
        LogData('Shard Died', `Shard ${shard.id} has died.`, 'error');
    }
    );
});

ShardManager.spawn().catch((error) => {
    LogData('Shard Spawn Error', 'An error occurred while spawning shards.', 'error');
    console.error(error);
});