import { Events, PermissionFlagsBits, AuditLogEvent, User, AttachmentBuilder, VoiceState } from 'discord.js';
import Client from '../../../structures/extendedClient.js';
import User_Level_Cache from '../cache/userLevels.cache.js';
import { ValidateXP } from '../utils/validation.js';

const voiceSessions = new Map();

export const name = Events.VoiceStateUpdate;
export const once = false;
export const description = 'User Voice XP';

/**
 * @param {VoiceState & { client: Client }} oldState
 * @param {VoiceState & { client: Client }} newState
 */

export async function execute(oldState, newState) {
    const { client } = newState;
    const member = newState.member ?? oldState.member;
    const guild = newState.guild ?? oldState.guild;

    if (!guild || !member || member.user.bot) return;

    const key = `${guild.id}:${member.id}`;

    if (oldState.channelId === newState.channelId) return;


    if(!oldState.channel && newState.channel) {
        const validate = await ValidateXP(member, newState.channel);
        if(!validate) return;

        voiceSessions.set(key, {
            joinedAt: Date.now(),
            channelId: newState.channelId,
        });

        client.utils.LogData('Voice XP', `Tracking started for @${member.user.username}`, 'debug');
    }


    if(oldState.channel && !newState.channel) {
        const session = voiceSessions.get(key);
        if(!session) return;

        voiceSessions.delete(key);

        const minutes = Math.floor((Date.now() - session.joinedAt) / 1000 / 60);
        if(minutes <= 0) return;

        const validate = await ValidateXP(member, oldState.channel);
        if(!validate) return;

        const { guildConfig } = validate;

        const addedXP = await User_Level_Cache.addVoiceXP(member, guildConfig, minutes);
        if(!addedXP) return;

        client.utils.LogData('Voice XP', `Added voice XP to @${member.user.username} for ${minutes} minutes`, 'debug');

        return;
    }

    if (oldState.channelId && newState.channelId) {
        const session = voiceSessions.get(key);

        if (session) {
            const minutes = Math.floor((Date.now() - session.joinedAt) / 1000 / 60);

            if (minutes > 0) {
                const validate = await ValidateXP(member, oldState.channel);

                if (validate) {
                    const { guildConfig } = validate;
                    await User_Level_Cache.addVoiceXP(member, guildConfig, minutes);
                }
            }
        }

        const validateNew = await ValidateXP(member, newState.channel);
        if (!validateNew) {
            voiceSessions.delete(key);
            return;
        }

        voiceSessions.set(key, {
            joinedAt: Date.now(),
            channelId: newState.channelId,
        });

        return;
    }
    
};