import { getLogChannel, findAuditLogExecutor } from './logChannel.js';

/**
 * Posts a server log (server settings, emojis, stickers) with whoever made the change, if the audit log says.
 *
 * @param {import('discord.js').Guild} guild
 * @param {object} log
 * @param {string} log.titleKey - Translation key under logs.server
 * @param {keyof typeof import('discord.js').Colors} log.colour
 * @param {string} log.description
 * @param {import('discord.js').AuditLogEvent} log.auditType - Used to find who made the change
 * @param {string} log.targetId - The changed server, emoji or sticker
 * @param {string} log.footer
 * @param {string | null} [log.thumbnail]
 */
export async function postServerLog(guild, { titleKey, colour, description, auditType, targetId, footer, thumbnail }) {
    const logChannel = await getLogChannel(guild, 'server');
    if (!logChannel) return;

    const executor = await findAuditLogExecutor(
        guild,
        auditType,
        (entry) => entry.targetId === targetId && Date.now() - entry.createdTimestamp < 10_000
    );

    const { client } = guild;
    await client.utils.Embed(
        logChannel,
        colour,
        client.utils.Translate(`logs.server.${titleKey}`, guild.preferredLocale),
        description,
        {
            timestamp: true,
            footer: { text: executor ? `${footer} | UID: ${executor.id}` : footer },
            author: executor,
            thumbnail: thumbnail ?? false,
        }
    );
}
