import { Events, AuditLogEvent } from 'discord.js';
import { getLogChannel, findAuditLogExecutor } from '../../utils/logChannel.js';

export const name = Events.GuildBanRemove;
export const once = false;
export const description = 'Guild Punishment Unban Logs';

/**
 * @param {import('discord.js').GuildBan} ban
 */

export async function execute(ban) {
    const { client, guild, user, reason } = ban;

    if (!guild) return;

    const logChannel = await getLogChannel(guild, 'punishment');
    if (!logChannel) return;

    const executor = await findAuditLogExecutor(
        guild,
        AuditLogEvent.MemberBanRemove,
        (entry) => entry.targetId === user.id && Date.now() - entry.createdTimestamp < 5000
    );

    const title = client.utils.Translate('logs.punishment.unban_title', guild.preferredLocale);
    const description = client.utils.Translate('logs.punishment.unban_description', guild.preferredLocale, {
        user,
        reason,
        moderator: executor ?? 'Unknown',
    });

    await client.utils.Embed(logChannel, 'Yellow', title, description, {
        timestamp: true,
        footer: { text: `UID: ${user.id}` },
        author: user,
    });
}
