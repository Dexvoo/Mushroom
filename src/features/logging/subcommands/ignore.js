import { MessageFlags } from 'discord.js';
import Logs_Cache from '../cache/logs.cache.js';

/**
 * @typedef {import('../../../core/extendedClient.js').default} Client
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 */
export async function execute(interaction) {
    const { client, options, guild, locale } = interaction;

    const enabled = options.getBoolean('enable');
    const channel = options.getChannel('channel') || null;
    const logsConfig = await Logs_Cache.get(guild.id);

    let ignoredChannels = logsConfig.ignoredChannels || [];

    console.log(ignoredChannels);
    if (enabled) {
        if (ignoredChannels.includes(channel.id))
            return client.utils.Embed(
                interaction,
                'Red',
                client.utils.Translate('errors.title', locale),
                client.utils.Translate('commands.log_ignore.already_ignored', locale, { channel: channel.toString() }),
                { flags: MessageFlags.Ephemeral }
            );

        ignoredChannels.push(channel.id);
        await Logs_Cache.set(guild.id, { ignoredChannels });

        return client.utils.Embed(
            interaction,
            'Green',
            client.utils.Translate('commands.log_ignore.title', locale),
            client.utils.Translate('commands.log_ignore.ignored_desc', locale, { channel: channel.toString() }),
            { flags: MessageFlags.Ephemeral }
        );
    }

    if (!ignoredChannels.includes(channel.id))
        return client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', locale),
            client.utils.Translate('commands.log_ignore.not_ignored', locale, { channel: channel.toString() }),
            { flags: MessageFlags.Ephemeral }
        );

    ignoredChannels = ignoredChannels.filter((ic) => ic !== channel.id);
    await Logs_Cache.set(guild.id, { ignoredChannels });

    return client.utils.Embed(
        interaction,
        'Green',
        client.utils.Translate('commands.log_ignore.resumed_title', locale),
        client.utils.Translate('commands.log_ignore.resumed_desc', locale, { channel: channel.toString() }),
        { flags: MessageFlags.Ephemeral }
    );
}
