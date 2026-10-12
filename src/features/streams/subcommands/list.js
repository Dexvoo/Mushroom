import { MessageFlags } from 'discord.js';
import { listSubscriptions, streamLimit, STREAM_LIMITS } from '../utils/subscriptions.js';
import { PLATFORMS } from '../utils/notification.js';
import { canManage } from '../../../shared/utils/commandChecks.js';

/**
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 */
export async function execute(interaction) {
    const { client, guild, locale } = interaction;
    if (!(await canManage(interaction))) return;
    const t = (key, args = {}) => client.utils.Translate(`commands.streams.${key}`, locale, args);

    const [subscriptions, limit] = await Promise.all([listSubscriptions(guild.id), streamLimit(guild.id)]);
    const ping = (roleId) => (roleId === 'everyone' ? '@everyone' : roleId ? `<@&${roleId}>` : t('no_ping'));

    const fields = Object.entries(PLATFORMS)
        .map(([platform, { name }]) => {
            const lines = subscriptions
                .filter((subscription) => subscription.platform === platform)
                .map((s) => `[${s.account.displayName}](${s.account.url}) → <#${s.channelId}> · ${ping(s.roleId)}`);
            return lines.length > 0 ? { name, value: lines.join('\n').slice(0, 1024) } : null;
        })
        .filter(Boolean);

    const usage = t('usage', { used: limit.used, max: limit.max });
    const premiumNote = limit.premium ? '' : ` ${t('limit_premium', { premiumMax: STREAM_LIMITS.PREMIUM })}`;
    return client.utils.Embed(interaction, 'Brand', t('title'), fields.length > 0 ? usage + premiumNote : t('none'), {
        fields,
        flags: MessageFlags.Ephemeral,
    });
}
