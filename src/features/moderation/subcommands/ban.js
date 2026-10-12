import { MessageFlags } from 'discord.js';
import { auditReason } from '../utils/checks.js';
import { hasPermissions, targetMember, notifyMember, recordCase, replySuccess, t } from '../utils/common.js';
import { replyError } from '../../../shared/utils/commandChecks.js';

/**
 * Bans a member, or anyone by ID (e.g. someone who already left).
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 */
export async function execute(interaction) {
    if (!(await hasPermissions(interaction, 'ban'))) return;
    const { guild, options, member } = interaction;
    const user = options.getUser('user', true);
    const reason = options.getString('reason');

    // Someone still in the server goes through the role checks; someone who left can be banned by ID
    const inServer = Boolean(options.getMember('user') ?? (await guild.members.fetch(user.id).catch(() => null)));
    if (inServer && !(await targetMember(interaction, 'ban'))) return;
    if (await guild.bans.fetch(user.id).catch(() => null)) {
        return replyError(interaction, t(interaction, 'already_banned', { user: user.toString() }));
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    // Before the ban, while they still share a server with Ovx
    const notified = inServer && (await notifyMember(interaction, user, 'ban', { reason }));

    try {
        await guild.bans.create(user.id, {
            reason: auditReason(member.user, reason),
            deleteMessageSeconds: options.getInteger('delete-messages') ?? 0,
        });
    } catch (error) {
        return replyError(interaction, t(interaction, 'action_failed', { error: error.message }));
    }

    const caseNumber = await recordCase(interaction, 'ban', user, { reason });
    return replySuccess(
        interaction,
        t(interaction, 'banned', { user: user.toString(), reason: reason ?? t(interaction, 'no_reason') }),
        { dmFailed: inServer && !notified, caseNumber }
    );
}
