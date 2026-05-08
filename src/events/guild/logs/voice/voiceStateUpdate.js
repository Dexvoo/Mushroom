import { Colors, Events, PermissionFlagsBits, VoiceState } from 'discord.js';
import Logs_Cache from '../../../../constants/cache/logs.js';
import Client from '../../../../core/client.js';

export const name = Events.VoiceStateUpdate;
export const once = false;
export const description = 'Guild Voice Logs';

/**
 * @param {VoiceState & { client: Client }} oldState
 * @param {VoiceState & { client: Client }} newState
 */

export async function execute(oldState, newState) {
    const { guild, member, client, channel } = newState;

    if (!guild) return;
    
    const logsData = await Logs_Cache.get(guild.id);
    if(!logsData?.voice?.enabled || !logsData?.voice?.channelId) return client.utils.LogData('Voice Updated', `Guild: ${guild.name} | Disabled`, 'warning');

    const relevantChannelId = newState.channelId || oldState.channelId
    if(logsData.ignoredChannels?.includes(relevantChannelId)) return client.utils.LogData('Voice Updated', `Guild: ${guild.name} | Ignored Channel`, 'info');
    
    const logChannel = guild.channels.cache.get(logsData.voice.channelId);
    if(!logChannel) {
        await Logs_Cache.setType(guild.id, 'voice', { enabled: false, channelId: null });
        return client.utils.LogData('Member Joined', `Guild: ${guild.name} | Log channel not found, disabling logs`, 'error');
    };

    const botPermissions = [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks ];
    const [ hasPermissions, missingPermissions ] = client.utils.PermissionCheck(logChannel, botPermissions, guild.members.me);
    if(!hasPermissions) {
        await Logs_Cache.setType(guild.id, 'voice', { enabled: false, channelId: null });
        return client.utils.LogData('Member Joined', `Guild: ${guild.name} | Missing permissions in log channel, disabling logs. Missing perms: ${missingPermissions.flat().join(', ')}`, 'error');
    }

    const footer = { text: `CID: ${relevantChannelId} | UID: ${member.id}`}

    if(!oldState.channel && newState.channel) return client.utils.Embed(logChannel, 'Green', client.utils.Translate('logs.voice.joined', guild.preferredLocale), `${newState.channel}`, { author: member.user, footer, timestamp: Date.now() });
    if(oldState.channel && !newState.channel || !newState.channel) return client.utils.Embed(logChannel, 'Red', client.utils.Translate('logs.voice.left', guild.preferredLocale), `${oldState.channel}`, { author: member.user, footer, timestamp: Date.now() });

    if(oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) return client.utils.Embed(logChannel, 'Green', client.utils.Translate('logs.voice.switched', guild.preferredLocale), `${oldState.channel} => ${newState.channel}`, { author: member.user, footer, timestamp: Date.now() });

    if(oldState.serverDeaf && !newState.serverDeaf) return client.utils.Embed(logChannel, 'Green', client.utils.Translate('logs.voice.server_undeafened', guild.preferredLocale), `${oldState.channel}`, { author: member.user, footer, timestamp: Date.now() });
    if(!oldState.serverDeaf && newState.serverDeaf) return client.utils.Embed(logChannel, 'Red', client.utils.Translate('logs.voice.server_deafened', guild.preferredLocale), `${newState.channel}`, { author: member.user, footer, timestamp: Date.now() });

    if(oldState.serverMute && !newState.serverMute) return client.utils.Embed(logChannel, 'Green', client.utils.Translate('logs.voice.server_unmuted', guild.preferredLocale), `${oldState.channel}`, { author: member.user, footer, timestamp: Date.now() });
    if(!oldState.serverMute && newState.serverMute) return client.utils.Embed(logChannel, 'Red', client.utils.Translate('logs.voice.server_muted', guild.preferredLocale), `${newState.channel}`, { author: member.user, footer, timestamp: Date.now() });

    if(oldState.selfVideo && !newState.selfVideo) return client.utils.Embed(logChannel, 'Red', client.utils.Translate('logs.voice.video_disabled', guild.preferredLocale), `${oldState.channel}`, { author: member.user, footer, timestamp: Date.now() });
    if(!oldState.selfVideo && newState.selfVideo) return client.utils.Embed(logChannel, 'Green', client.utils.Translate('logs.voice.video_enabled', guild.preferredLocale), `${newState.channel}`, { author: member.user, footer, timestamp: Date.now() });
};