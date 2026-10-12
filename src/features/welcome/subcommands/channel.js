import { MessageFlags } from 'discord.js';
import { POST_PERMISSIONS, saveMessageSettings } from '../utils/welcomeCommand.js';
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
    const channel = options.getChannel('channel', true);

    const missing = guild.members.me?.permissionsIn(channel).missing(POST_PERMISSIONS) ?? [];
    if (missing.length > 0) {
        return replyError(
            interaction,
            translate('cannot_post', { channel: channel.toString(), perms: missing.join(', ') })
        );
    }

    const saved = await saveMessageSettings(guild.id, kind, { channelId: channel.id });
    const lines = [translate('channel_set', { label, channel: channel.toString() })];
    if (!saved.enabled) lines.push(translate('currently_off', { command: `/${kind} toggle` }));

    return client.utils.Embed(interaction, 'Brand', label, lines.join('\n\n'), { flags: MessageFlags.Ephemeral });
}
