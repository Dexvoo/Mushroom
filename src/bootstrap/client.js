import { GatewayIntentBits, Collection } from 'discord.js';
import loadCommands from '../core/baseCommands.js';
import loadEvents from '../core/baseEvents.js';
import refreshCommands from '../core/baseRefresh.js';
import Client from '../core/extendedClient.js';
import { ENV } from './environment.js';
import { checkVersion } from '../shared/utils/versionCheck.js';
import { Database_Connect } from './database.js';
import { Shutdown } from './shutdown.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildExpressions,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();

// Registered before any startup work so failures during loading are caught too
process.on('SIGINT', () => Shutdown('SIGINT', client)); // CTRL+C in terminal
process.on('SIGTERM', () => Shutdown('SIGTERM', client)); // Docker/PM2 stop commands
process.on('unhandledRejection', (reason) => {
    client.utils.LogData('Unhandled Rejection', reason?.stack ?? String(reason), 'error');
});
process.on('uncaughtException', (error) => {
    // State is unknown after an uncaught exception; exit and let the ShardingManager respawn this shard
    client.utils.LogData('Uncaught Exception', error.stack ?? error.message, 'error');
    process.exit(1);
});

// Resolved from this file rather than process.cwd() so the bot can be started from any directory
const featuresPath = fileURLToPath(new URL('../features', import.meta.url));
const features = fs.readdirSync(featuresPath, { withFileTypes: true }).filter((entry) => entry.isDirectory());
client.utils.Log('Loading Commands/Events');
for (const feature of features) {
    const featurePath = path.join(featuresPath, feature.name);
    const commandsPath = path.join(featurePath, 'commands');
    const eventsPath = path.join(featurePath, 'events');

    // Features don't need both folders, e.g. an events-only feature
    if (fs.existsSync(commandsPath)) await loadCommands(client, commandsPath);
    if (fs.existsSync(eventsPath)) await loadEvents(client, eventsPath);
}

if (!client.shard || client.shard.ids[0] === 0) {
    client.utils.Log('Refreshing Commands');
    await refreshCommands(client);
} else {
    client.utils.LogData('Command Refresh', `Skipped on Shard ${client.shard.ids[0]} to prevent API spam.`, 'info');
}

const token = ENV.DEVELOPER_MODE ? ENV.BOT_TOKEN_DEV : ENV.BOT_TOKEN;

try {
    await Database_Connect(client);
    await checkVersion(client.utils.LogData);

    await client.login(token);
} catch (error) {
    client.utils.LogData('Startup', `Failed to start: ${error.stack ?? error.message}`, 'error');
    process.exit(1);
}
