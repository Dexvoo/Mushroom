import { MessageFlags } from 'discord.js';
import Welcome_Cache from '../cache/welcome.cache.js';
import { saveMessageSettings } from '../utils/welcomeCommand.js';
import { canManage, replyError } from '../../../shared/utils/commandChecks.js';

/**
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 * @param {'welcome' | 'goodbye'} kind
 */
export async function execute(interaction, kind) {
    const { client, options, guild, locale } = interaction;
    if (!(await canManage(interaction))) return;

    const translate = (name, args = {}) => client.utils.Translate(`commands.welcome.${name}`, locale, args);
    const label = translate(`label_${kind}`);
    const enabled = options.getBoolean('enabled', true);

    const current = (await Welcome_Cache.get(guild.id))[kind];
    if (enabled && !current?.channelId) {
        return replyError(interaction, translate('needs_channel', { command: `/${kind} channel` }));
    }

    await saveMessageSettings(guild.id, kind, { enabled });
    return client.utils.Embed(
        interaction,
        'Brand',
        label,
        translate(enabled ? `enabled_${kind}` : `disabled_${kind}`, {
            channel: current?.channelId ? `<#${current.channelId}>` : '',
        }),
        { flags: MessageFlags.Ephemeral }
    );
}
