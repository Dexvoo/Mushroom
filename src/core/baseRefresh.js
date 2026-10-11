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

        const applicationId = ENV.DEVELOPER_MODE ? ENV.BOT_APPLICATION_ID_DEV : ENV.BOT_APPLICATION_ID;
        const guildId = ENV.DEV_GUILD_ID;
        const hasDevGuild = Boolean(guildId) && guildId !== 'none';

        const [devCommands, publicCommands] = client.commands.partition((cmd) => cmd.meta.developerOnly);

        if (ENV.DEVELOPER_MODE && hasDevGuild) {
            // Developer mode registers everything to the dev guild only (instant updates)
            await rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
                body: client.commands.map((cmd) => cmd.commandData),
            });
        } else if (hasDevGuild) {
            // Production: public commands globally, developer commands only in the dev guild
            await rest.put(Routes.applicationCommands(applicationId), {
                body: publicCommands.map((cmd) => cmd.commandData),
            });
            await rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
                body: devCommands.map((cmd) => cmd.commandData),
            });
        } else {
            client.utils.LogData(
                'Command Refresh',
                'No DEV_GUILD_ID set; developer-only commands are registered globally.',
                'warning'
            );
            await rest.put(Routes.applicationCommands(applicationId), {
                body: client.commands.map((cmd) => cmd.commandData),
            });
        }

        client.utils.LogData('Command Refresh', 'Successfully reloaded application (/) commands.', 'success');
    } catch (error) {
        client.utils.LogData('Command Refresh', 'Error occurred while refreshing application (/) commands.', 'error');
        console.error(error);
    }
}
