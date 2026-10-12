import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import { addSubscription, STREAM_LIMITS } from '../utils/subscriptions.js';
import { PLATFORMS } from '../utils/notification.js';
import { canManage, replyError } from '../../../shared/utils/commandChecks.js';

const POST_PERMISSIONS = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.EmbedLinks,
];

/**
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 */
export async function execute(interaction) {
    const { client, options, guild, locale } = interaction;
    if (!(await canManage(interaction))) return;
    const t = (key, args = {}) => client.utils.Translate(`commands.streams.${key}`, locale, args);

    const platform = /** @type {'twitch' | 'youtube' | 'kick'} */ (options.getString('platform', true));
    const channel = options.getChannel('channel', true);
    const role = options.getRole('ping');
    const platformName = PLATFORMS[platform].name;

    const missing = guild.members.me?.permissionsIn(channel).missing(POST_PERMISSIONS) ?? [];
    if (missing.length > 0)
        return replyError(interaction, t('cannot_post', { channel: channel.toString(), perms: missing.join(', ') }));

    // Looking the account up on the platform can take a moment
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const result = /** @type {any} */ (
        await addSubscription({
            guildId: guild.id,
            platform,
            query: options.getString('account', true),
            channelId: channel.id,
            // The everyone role means pinging everyone
            roleId: role ? (role.id === guild.id ? 'everyone' : role.id) : null,
        })
    );

    if (!result.ok) {
        return replyError(
            interaction,
            t(result.reason, { platform: platformName, max: result.max, premiumMax: STREAM_LIMITS.PREMIUM }) +
                (result.reason === 'limit' && !result.premium
                    ? ` ${t('limit_premium', { premiumMax: STREAM_LIMITS.PREMIUM })}`
                    : '')
        );
    }

    return client.utils.Embed(
        interaction,
        'Brand',
        t('title'),
        t('added', {
            name: result.subscription.account.displayName,
            platform: platformName,
            channel: channel.toString(),
        }),
        { flags: MessageFlags.Ephemeral }
    );
}
