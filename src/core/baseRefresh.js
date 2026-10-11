import { REST, Routes } from 'discord.js';
import { ENV } from '../bootstrap/environment.js';

/**
 * @typedef {import('../core/extendedClient.js').default} Client
 * @param { Client } client
 */

export default async function refreshCommands(client) {
    const token = ENV.DEVELOPER_MODE ? ENV.BOT_TOKEN_DEV : ENV.BOT_TOKEN;
    const rest = new REST({ version: '10' }).setToken(token);

    try {
        client.utils.LogData('Command Refresh', 'Started refreshing application (/) commands.', 'info');

        const commands = client.commands.map((cmd) => cmd.commandData);

        const applicationId = ENV.DEVELOPER_MODE ? ENV.BOT_APPLICATION_ID_DEV : ENV.BOT_APPLICATION_ID;
        const guildId = ENV.DEV_GUILD_ID;

        // Developer mode registers to the dev guild only (instant updates); production registers globally.
        if (ENV.DEVELOPER_MODE && guildId && guildId !== 'none') {
            await rest.put(Routes.applicationGuildCommands(applicationId, guildId), { body: commands });
        } else {
            await rest.put(Routes.applicationCommands(applicationId), { body: commands });
        }

        client.utils.LogData('Command Refresh', 'Successfully reloaded application (/) commands.', 'success');
    } catch (error) {
        client.utils.LogData('Command Refresh', 'Error occurred while refreshing application (/) commands.', 'error');
        console.error(error);
    }
}
