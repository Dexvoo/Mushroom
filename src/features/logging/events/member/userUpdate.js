import { Events, PermissionFlagsBits, User} from 'discord.js';
import Logs_Cache from '../../cache/logs.cache.js';
import Client from '../../../../structures/extendedClient.js';

export const name = Events.UserUpdate;
export const once = false;
export const description = 'User Update Logs';

/**
 * @param { User & { client: Client }} oldUser
 * @param { User & { client: Client }} newUser
 */
export async function execute(oldUser, newUser) {

    if (oldUser.partial) return;

    const { client } = newUser;

    const fields =[];
    let thumbnail = false;

    if (oldUser.username !== newUser.username) {
        fields.push({
            name: 'Username',
            value: `\`${oldUser.username}\` → \`${newUser.username}\``,
            inline: false,
        });
    }

    if (oldUser.globalName !== newUser.globalName) {
        const oldGName = oldUser.globalName || 'None';
        const newGName = newUser.globalName || 'None';
        fields.push({
            name: 'Global Display Name',
            value: `\`${oldGName}\` → \`${newGName}\``,
            inline: false,
        });
    }

    if (oldUser.avatar !== newUser.avatar) {
        const isRemoved = !newUser.avatar;
        fields.push({
            name: 'Global Avatar',
            value: isRemoved ? 'Removed' : 'Updated',
            inline: false,
        });

        const avatarUrl = isRemoved 
            ? oldUser.displayAvatarURL({ extension: 'png', size: 512 }) 
            : newUser.displayAvatarURL({ extension: 'png', size: 512 });

        if (avatarUrl) thumbnail = avatarUrl;
    }

    if (oldUser.hexAccentColor !== newUser.hexAccentColor) {
        const oldColor = oldUser.hexAccentColor || 'None';
        const newColor = newUser.hexAccentColor || 'None';
        fields.push({
            name: 'Accent Color',
            value: `\`${oldColor}\` → \`${newColor}\``,
            inline: false,
        });
    }

    if (fields.length === 0) return;

    const mutualGuilds = client.guilds.cache.filter((guild) => guild.members.cache.has(newUser.id));

    for (const guild of mutualGuilds.values()) {
        try {
            const logsData = await Logs_Cache.get(guild.id);
            if (!logsData?.member?.enabled || !logsData?.member?.channelId) continue;
            
            const logChannel = guild.channels.cache.get(logsData.member.channelId);
            if (!logChannel) {
                await Logs_Cache.setType(guild.id, 'member', { enabled: false, channelId: null });
                continue;
            }

            const botPermissions = [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks ];
            const [ hasPermissions ] = client.utils.PermissionCheck(logChannel, botPermissions, guild.members.me);
            if (!hasPermissions) {
                await Logs_Cache.setType(guild.id, 'member', { enabled: false, channelId: null });
                continue;
            }

            const title = client.utils.Translate('logs.member.user_update_title', guild.preferredLocale);
            const footerText = `UID: ${newUser.id}`;

            await client.utils.Embed(logChannel, 'Aqua', title, '', { 
                timestamp: true, 
                footer: { text: footerText }, 
                author: newUser, 
                fields, 
                thumbnail 
            });

        } catch (error) {
            client.utils.LogData('User Update', `Guild: ${guild.name} | Error processing mutual guild log: ${error.message}`, 'error');
        }
    }
};