import { BaseInteraction, EmbedBuilder, DiscordAPIError, RESTJSONErrorCodes } from 'discord.js';
import { ENV } from '../../bootstrap/environment.js';
import { LogData } from './logger.js';
import Global_Cache from '../../features/utility/cache/global.js';
/**
 * @typedef {import('../../core/extendedClient.js').default} Client
 */
/**
 * Create and send an embed message.
 * @param { BaseInteraction | import('discord.js').GuildBasedChannel | import('discord.js').TextBasedChannel | import('discord.js').User | import('discord.js').GuildMember } target - The target to send the embed to.
 * @param { keyof typeof import('discord.js').Colors } colour - The colour of the embed.
 * @param { string } title - The title of the embed.
 * @param { string } description - The description of the embed.
 * @param { object } [options={}] Optional parameters.
 * @param { import('discord.js').APIEmbedField[] } [options.fields=[]] - The fields of the embed.
 * @param { import('discord.js').InteractionReplyOptions['flags'] } [options.flags] - Whether the message should be ephemeral (only for interactions).
 * @param { import('discord.js').BaseMessageOptions['components'] } [options.components=[]] - The components (buttons, select menus) to include in the message.
 * @param { import('discord.js').AttachmentBuilder[] }[options.files=[]] - The files to attach to the message.
 * @param { import('discord.js').EmbedFooterOptions } [options.footer] - The footer of the embed.
 * @param { boolean | number | Date } [options.timestamp] - true for now, or a specific time
 * @param { import('discord.js').User | import('discord.js').PartialUser | null } [options.author] - author
 * @param { string | false } [options.thumbnail] - image url, or false for none
 * @param { string } [options.url] - url for title
 * @returns { Promise<import('discord.js').Message | import('discord.js').InteractionResponse | null | undefined> } The sent message or reply, or null/undefined if nothing was sent
 */

async function Embed(target, colour, title, description, options = {}) {
    if (!target) {
        LogData('Embed Utility', 'No target provided for embed.', 'error');
        return null;
    }

    const client = /** @type {Client} */ (target.client);
    const {
        fields = [],
        flags = [],
        components = [],
        files = [],
        footer = null,
        timestamp = false,
        author = false,
        thumbnail = false,
        url = false,
    } = options;

    if (!colour || !title) {
        client.utils.LogData(
            'Embed Utility',
            `Missing required parameters. Colour: ${!!colour}, Title: ${!!title}`,
            'error'
        );
        return null;
    }

    const embed = new EmbedBuilder().setColor(colour).setTitle(title).addFields(fields);

    if (footer) {
        embed.setFooter(footer);
    }

    if (thumbnail !== false) {
        embed.setThumbnail(thumbnail);
    }

    if (description !== undefined && description !== '') {
        embed.setDescription(description);
    }

    if (timestamp) {
        embed.setTimestamp(timestamp === true ? undefined : timestamp);
    }
    if (author) {
        embed.setAuthor({ name: author.username, iconURL: author.displayAvatarURL({ size: 512, extension: 'png' }) });
    }
    if (url) {
        embed.setURL(url);
    }

    try {
        if (target instanceof BaseInteraction && target.isRepliable()) {
            if (target.replied || target.deferred) {
                return await target.followUp({ embeds: [embed], components, files, flags });
            } else {
                return await target.reply({ embeds: [embed], components, files, flags });
            }
        } else if ('send' in target) {
            // Users, members and text-based channels
            // Reply-only flags (e.g. Ephemeral) don't apply to normal messages, but others like SuppressEmbeds do
            return await target.send({ embeds: [embed], components, files, flags: /** @type {any} */ (flags) });
        }
    } catch (error) {
        if (error instanceof DiscordAPIError && error.code === RESTJSONErrorCodes.CannotSendMessagesToThisUser) {
            console.warn(`Could not send embed to ${'tag' in target ? target.tag : target.id} - DMs are closed.`);
        } else {
            console.error(error);
        }
    }
}

/**
 * Sends an embed log to the specified log channel based on the type of log.
 * @param {'command' | 'joinGuild' | 'leaveGuild' | 'userLevel' | 'vote' } type - types of logs
 * @param {Client} client - discord client
 * @param {EmbedBuilder} embed - The embed to send
 */
async function DevEmbed(type, client, embed) {
    if (!type) throw new Error('No type provided.');
    if (!client) throw new Error('No interaction provided.');
    if (!embed) throw new Error('No embed provided.');

    const typesOfLogs = {
        command: ENV.COMMAND_CID,
        joinGuild: ENV.JOIN_GUID_CID,
        leaveGuild: ENV.LEAVE_GUILD_CID,
        userLevel: ENV.USER_LEVEL_CID,
        vote: ENV.VOTE_CID,
    };

    const currentLogChannelId = typesOfLogs[type];
    if (!currentLogChannelId) throw new Error(`No log channel found for ${type}`);

    try {
        await client.shard.broadcastEval(
            async (ShardClient, { embed, channelId, guildId }) => {
                const guild = ShardClient.guilds.cache.get(guildId);
                if (!guild) return console.error(`Guild with ID ${guildId} not found.`);

                const channel = guild.channels.cache.get(channelId);
                if (!channel?.isTextBased()) return;

                await channel.send({ embeds: [embed] });
            },
            {
                context: {
                    embed: embed,
                    channelId: currentLogChannelId,
                    guildId: ENV.DEV_GUILD_ID,
                },
                shard: Global_Cache.DevSID,
            }
        );
    } catch (error) {
        console.error(error);
    }
}

export { Embed, DevEmbed };
