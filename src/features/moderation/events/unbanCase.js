import { Events, AuditLogEvent } from 'discord.js';
import { recordDiscordCase } from '../utils/discordCases.js';

export const name = Events.GuildBanRemove;
export const once = false;
export const description = 'Records unbans made in Discord as moderation cases';

/**
 * @param {import('discord.js').GuildBan} ban
 */
export async function execute(ban) {
    await recordDiscordCase(ban.guild, { type: AuditLogEvent.MemberBanRemove, action: 'unban', user: ban.user });
}
