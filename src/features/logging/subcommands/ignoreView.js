import { Events, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import Client from '../../../structures/extendedClient.js';
import Logs_Cache from '../cache/logs.cache.js'

/**
 * @param { ChatInputCommandInteraction & { client: Client }} interaction
 */

export async function execute(interaction) {
    const { client, options, guild, member } = interaction;

    const logsConfig = await Logs_Cache.get(guild.id);
    const ignored = await logsConfig.ignoredChannels;   

    if (!ignored || ignored.length === 0) return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), client.utils.Translate('commands.log_ignore_view.no_channels', interaction.locale), { flags: [MessageFlags.Ephemeral] });

    const description = ignored.map((id) => `<#${id}>`).join('\n') || 'None';
    return client.utils.Embed(interaction, 'DarkPurple', client.utils.Translate('commands.log_ignore_view.title', interaction.locale), description, { flags: [ MessageFlags.Ephemeral ] });

}