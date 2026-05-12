import { GatewayIntentBits, Collection } from 'discord.js';
import loadCommands from '../structures/baseCommands.js';
import loadEvents from '../structures/baseEvents.js';
import refreshCommands from '../structures/baseRefresh.js';
import Client from '../structures/extendedClient.js';
import { ENV } from './environment.js';
import { checkVersion } from '../shared/utils/versionCheck.js';
import { Database_Connect, Database_Disconnect } from './database.js';
import { Shutdown } from './shutdown.js';
import fs from 'fs';
import path from 'path';

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

const featuresPath = path.join(process.cwd(), 'src/features');
const features = fs.readdirSync(featuresPath);
client.utils.Log('Loading Commands/Events');
for (const feature of features) {
    const featurePath = path.join(featuresPath, feature);

    await loadCommands(client, path.join(featurePath, 'commands'));
    await loadEvents(client, path.join(featurePath, 'events'));
}

if (!client.shard || client.shard.ids[0] === 0) {
    client.utils.Log('Refreshing Commands');
    await refreshCommands(client);
} else {
    client.utils.LogData('Command Refresh', `Skipped on Shard ${client.shard.ids[0]} to prevent API spam.`, 'info');
}

const token = ENV.DEVELOPER_MODE ? ENV.BOT_TOKEN_DEV : ENV.BOT_TOKEN;

try {
    await Database_Connect()
    await checkVersion(client.utils.LogData);

    client.login(token); 
} catch (error) {
    console.error(error)
    process.exit(1); 
}

process.on('SIGINT', () => Shutdown('SIGINT', client));   // CTRL+C in terminal
process.on('SIGTERM', () => Shutdown('SIGTERM', client)); // Docker/PM2 stop commands
process.on('unhandledRejection', (reason, promise) => {
    console.log(reason)
    client.utils.LogData('Unhandled Rejection', String(reason), 'error');
});
process.on('uncaughtException', (err) => {
    console.log(err)
    client.utils.LogData('Uncaught Exception', err.message, 'error');
});