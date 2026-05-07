import { REST, Routes } from 'discord.js';
import Client from '../../core/client.js';
import { ENV } from '../../core/env.js';

/**
 * @param { Client } client
*/

export default async function refreshCommands(client) {
    const rest = new REST({ version: '10' }).setToken(ENV.BOT_TOKEN);

    try {
        client.utils.LogData('Command Refresh', 'Started refreshing application (/) commands.', 'info');

        const commands = client.commands.map((cmd) => cmd.commandData);

        const token = ENV.DEVELOPER_MODE ? ENV.BOT_TOKEN_DEV : ENV.BOT_TOKEN;
        const applicationId = ENV.DEVELOPER_MODE ? ENV.BOT_APPLICATION_ID_DEV : ENV.BOT_APPLICATION_ID;
        const guildId = ENV.DEV_GUILD_ID;

        if(!guildId || guildId === 'none') {
            await rest.put(Routes.applicationCommands(applicationId), { body: commands });
        } else {
            await rest.put(Routes.applicationGuildCommands(applicationId, guildId), { body: commands });
        }

        client.utils.LogData('Command Refresh', 'Successfully reloaded application (/) commands.', 'success');
        
    } catch (error) {
        client.utils.LogData('Command Refresh', 'Error occurred while refreshing application (/) commands.', 'error');
        console.error(error);
    }
}