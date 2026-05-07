import { GatewayIntentBits, Collection } from 'discord.js';
import loadCommands from './handlers/loading/commands.js';
import loadEvents from './handlers/loading/events.js';
import refreshCommands from './handlers/loading/refresh.js';
import Client from './core/client.js';
import mongoose from 'mongoose';
import { ENV } from './core/env.js';
import { checkVersion } from './utils/versionCheck.js';

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
client.utils.Log('Initialising Bot');
client.utils.Log('Loading Commands');
await loadCommands(client, './src/Commands');
client.utils.Log('Loading Events');
await loadEvents(client, './src/Events');
if (!client.shard || client.shard.ids[0] === 0) {
    client.utils.Log('Refreshing Commands');
    await refreshCommands(client);
} else {
    client.utils.LogData('Command Refresh', `Skipped on Shard ${client.shard.ids[0]} to prevent API spam.`, 'info');
}
 
process.on('unhandledRejection', (reason, promise) => {
    client.utils.LogData('Unhandled Rejection', String(reason), 'error');
});
process.on('uncaughtException', (err) => {
    console.log(err)
    client.utils.LogData('Uncaught Exception', err.message, 'error');
});

const token = ENV.DEVELOPER_MODE ? ENV.BOT_TOKEN_DEV : ENV.BOT_TOKEN;

client.utils.Log('Connecting to MongoDB');
try {
    await mongoose.connect(ENV.MONGO_URI);
    client.utils.LogData('MongoDB', 'Connected to the database successfully.', 'success');

    await checkVersion(client.utils.LogData);

    client.login(token); 
} catch (error) {
    client.utils.LogData('MongoDB', `Failed to connect: ${error.message}`, 'error');
    process.exit(1); 
}

const shutdown = async (signal) => {
    client.utils.LogData('Shutdown Initiated', `Received ${signal}. Closing connections cleanly...`, 'warning');
    
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            client.utils.LogData('MongoDB', 'Database connection closed.', 'success');
        }
        client.destroy();
        client.utils.LogData('Discord', 'Client disconnected.', 'success');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGINT', () => shutdown('SIGINT'));   // CTRL+C in terminal
process.on('SIGTERM', () => shutdown('SIGTERM')); // Docker/PM2 stop commands