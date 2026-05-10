import { ChatInputCommandInteraction, Colors } from 'discord.js';
import Client from '../../../core/client.js';
import Logs_Cache from '../../../constants/cache/logs.js';

/**
 * @param { ChatInputCommandInteraction & { client: Client }} interaction
 */
export async function execute(interaction) {
    const { client, options, guild, locale } = interaction;

    const enabled = options.getBoolean('enable');
    const channel = options.getChannel('channel') || null;
    const logsConfig = await Logs_Cache.get(guild.id);

    let ignoredChannels = logsConfig.ignoredChannels || [];

    console.log(ignoredChannels)
    if (enabled) {
        if (ignoredChannels.includes(channel.id)) return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', locale), client.utils.Translate('commands.log_ignore.already_ignored', locale, { channel: channel.toString() }));
        
        ignoredChannels.push(channel.id);
        console.log('pushing channel id to ', ignoredChannels)
        await Logs_Cache.setType(guild.id, 'ignoredChannels', ignoredChannels);

        return client.utils.Embed( interaction, 'Green',  client.utils.Translate('commands.log_ignore.ignored_title', locale),  client.utils.Translate('commands.log_ignore.ignored_desc', locale, { channel: channel.toString() }));
    }

    if (!ignoredChannels.includes(channel.id)) return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', locale), client.utils.Translate('commands.log_ignore.not_ignored', locale, { channel: channel.toString() }));

    ignoredChannels = ignoredChannels.filter((ic) => ic !== channel.id);
    await Logs_Cache.setType(guild.id, 'ignoredChannels', ignoredChannels);

    return client.utils.Embed(interaction, Colors.Green, client.utils.Translate('commands.log_ignore.resumed_title', locale), client.utils.Translate('commands.log_ignore.resumed_desc', locale, { channel: channel.toString() }));
}