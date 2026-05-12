import { BaseInteraction, EmbedBuilder, GuildMember, TextChannel, User, Colors, DiscordAPIError, RESTJSONErrorCodes, MessageFlags, ActionRowBuilder, AttachmentBuilder, Message, Collection, Attachment, ThumbnailBuilder } from 'discord.js';
import Client from '../../structures/extendedClient.js';
import { ENV } from '../../bootstrap/environment.js';
import Global_Cache from '../../features/utility/cache/global.js';

/**
 * Create and send an embed message.
 * @param { BaseInteraction | TextChannel | User | GuildMember } target - The target to send the embed to.
 * @param { keyof typeof Colors } colour - The colour of the embed.
 * @param { string } title - The title of the embed.
 * @param { string } description - The description of the embed.
 * @param { object } [options={}] Optional parameters.
 * @param { import('discord.js').APIEmbedField[] } [options.fields=[]] - The fields of the embed.
 * @param { MessageFlags } [options.flags] - Whether the message should be ephemeral (only for interactions).
 * @param { ActionRowBuilder[] } [options.components=[]] - The components (buttons, select menus) to include in the message.
 * @param { AttachmentBuilder[] }[options.files=[]] - The files to attach to the message.
 * @param { import('discord.js').EmbedFooterOptions } [options.footer] - The footer of the embed.
 * @param { boolean }[options.timestamp] - timestamp
 * @param { User } [options.author] - author
 * @param { string } [options.thumbnail] - image url
 * @param { string } [options.url] - url for title
 * @returns { Promise<Message | void> } The sent message, or void if the target is not an interaction.
 */

async function Embed(target, colour, title, description, options = {}) {
	const { client } = target
	const { fields = [], flags = [], components = [], files =[], footer = null, timestamp = false, author = false, thumbnail = false, url = false } = options;

	if(!target) {
        client.utils.LogData('Embed Utility', 'No target provided for embed.', 'error');
        return null;
    }

	if(!colour || !title) {
        client.utils.LogData('Embed Utility', `Missing required parameters. Colour: ${!!colour}, Title: ${!!title}`, 'error');
        return null;
    }

	const embed = new EmbedBuilder()
		.setColor(colour)
		.setTitle(title)
		.addFields(fields);

	if(footer) {
		embed.setFooter(footer);
	}

	if(thumbnail !== false) {
		embed.setThumbnail(thumbnail);
	}
	
	if(description !== undefined && description !== '') {
		embed.setDescription(description);
	}

	if(timestamp) {
		embed.setTimestamp();
	}
	if(author) {
		embed.setAuthor({ name: author.username, iconURL: author.displayAvatarURL({ size: 512, extension: 'png' }), })
	}
	if(url) {
		embed.setURL(url)
	}

	try {
		if(target instanceof BaseInteraction) {
			if(target.replied || target.deferred) {
				return await target.followUp({ embeds:[embed], components, files, flags });
			} else {
				return await target.reply({ embeds:[embed], components, files, flags });
			}
			
		} else if(target instanceof User || target instanceof GuildMember || target instanceof TextChannel) {
			return await target.send({ embeds:[embed], components, files, flags });
		}
	} catch (error) {
		if(error instanceof DiscordAPIError && error.code === RESTJSONErrorCodes.CannotSendMessagesToThisUser) {
			console.warn(`Could not send embed to ${target.tag || target.id} - DMs are closed.`);
		} else {
			console.error(error);
		}
	}
};


/**
 * Sends an embed log to the specified log channel based on the type of log.
 * @param {'command' | 'joinGuild' | 'leaveGuild' | 'userLevel' | 'vote' } type - types of logs
 * @param {Client} client - discord client
 * @param {EmbedBuilder} embed - The embed to send
 */
async function DevEmbed(type, client, embed) {
	if(!type) throw new Error('No type provided.');
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
	if(!currentLogChannelId) throw new Error(`No log channel found for ${type}`);

	try {
		await client.shard.broadcastEval(async (ShardClient, { embed, channelId, guildId }) => {
			const guild = ShardClient.guilds.cache.get(guildId);
			if (!guild) return console.error(`Guild with ID ${guildId} not found.`);

			const channel = guild.channels.cache.get(channelId);
			if(!channel) return;

			await channel.send({ embeds: [embed] });
		}, { context: {
				embed: embed, 
				channelId: currentLogChannelId,
				guildId: ENV.DEV_GUILD_ID
			},
			shard: Global_Cache.DevSID,
		});
	} catch (error) {
		console.error(error);
		
	}
};

export { Embed, DevEmbed };