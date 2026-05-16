import { Events, PermissionFlagsBits, AuditLogEvent, User, Message, AttachmentBuilder } from 'discord.js';
import Client from '../../../structures/extendedClient.js';
import User_Level_Cache from '../cache/userLevels.cache.js';
import { ValidateXP } from '../utils/validation.js';

export const name = Events.MessageCreate;
export const once = false;
export const description = 'User Message XP';

/**
 * @param {Message & { client: Client }} message
 */

export async function execute(message) {
    const { guild, author, member, channel, content, attachments, client } = message;

    if (author.bot || !guild || !member || !channel.isTextBased()) return;

    const cleanContent = content.trim();
    if (cleanContent.length < 5 && attachments.size === 0) return;


    const validate = await ValidateXP(member, channel);
    if(!validate) return;

    const { guildConfig } = validate;

    const expiresAt = client.cooldowns.getRemaining('message', author.id, guild.id);

    const cooldownEnd = new Date(expiresAt);


    if(expiresAt) return client.utils.LogData('Message Cooldown', `Guild: ${guild.name} | User: @${member.user.username} | Time: ${(cooldownEnd - new Date())/1000}`, 'debug');

    const addedXP = await User_Level_Cache.addMessageXP(member, guildConfig)
    if(!addedXP) return;

    client.cooldowns.add('message', author.id, guildConfig.messageCooldown ?? 30, guild.id);
    
};