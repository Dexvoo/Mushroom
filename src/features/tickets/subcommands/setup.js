import { MessageFlags } from 'discord.js';
import Ticket_Config_Cache from '../cache/ticketConfig.cache.js';
import { CATEGORY_PERMISSIONS, TRANSCRIPT_PERMISSIONS } from '../utils/access.js';
import { TICKET_LIMITS } from '../../../dashboard/validation.js';
import { canManage, replyError } from '../../../shared/utils/commandChecks.js';

/**
 * The basics from a command; everything else is on the dashboard.
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 */
export async function execute(interaction) {
    const { client, options, guild, locale } = interaction;
    if (!(await canManage(interaction))) return;
    const t = (key, args = {}) => client.utils.Translate(`tickets.${key}`, locale, args);

    const enabled = options.getBoolean('enabled', true);
    const category = options.getChannel('category');
    const staffRole = options.getRole('staff-role');
    const transcriptChannel = options.getChannel('transcript-channel');
    const me = guild.members.me;

    const current = await Ticket_Config_Cache.get(guild.id);
    /** @type {Record<string, any>} */
    const updates = { enabled };

    if (category) {
        const missing = me?.permissionsIn(category).missing(CATEGORY_PERMISSIONS) ?? [];
        if (missing.length > 0) {
            return replyError(
                interaction,
                t('setup_category_permissions', { channel: category.toString(), perms: missing.join(', ') })
            );
        }
        updates.categoryId = category.id;
    }
    if (enabled && !updates.categoryId && !current.categoryId)
        return replyError(interaction, t('setup_needs_category'));

    if (transcriptChannel) {
        const missing = me?.permissionsIn(transcriptChannel).missing(TRANSCRIPT_PERMISSIONS) ?? [];
        if (missing.length > 0) {
            return replyError(
                interaction,
                t('setup_transcript_permissions', { channel: transcriptChannel.toString(), perms: missing.join(', ') })
            );
        }
        updates.transcriptChannelId = transcriptChannel.id;
    }

    if (staffRole) {
        if (staffRole.id === guild.id) return replyError(interaction, t('setup_everyone'));
        const roles = current.staffRoleIds.filter((id) => guild.roles.cache.has(id));
        if (!roles.includes(staffRole.id)) {
            if (roles.length >= TICKET_LIMITS.STAFF_ROLES_MAX) {
                return replyError(interaction, t('setup_staff_full', { max: TICKET_LIMITS.STAFF_ROLES_MAX }));
            }
            updates.staffRoleIds = [...roles, staffRole.id];
        }
    }

    const saved = await Ticket_Config_Cache.set(guild.id, updates);
    const none = t('none');
    return client.utils.Embed(interaction, 'Brand', t('title'), t(enabled ? 'setup_on' : 'setup_off'), {
        fields: [
            { name: t('field_category'), value: saved.categoryId ? `<#${saved.categoryId}>` : none, inline: true },
            {
                name: t('field_transcripts'),
                value: saved.transcriptChannelId ? `<#${saved.transcriptChannelId}>` : none,
                inline: true,
            },
            {
                name: t('field_staff'),
                value: saved.staffRoleIds.map((id) => `<@&${id}>`).join(' ') || none,
                inline: false,
            },
        ],
        flags: MessageFlags.Ephemeral,
    });
}
