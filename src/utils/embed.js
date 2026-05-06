import { BaseInteraction, EmbedBuilder, GuildMember, TextChannel, User, Colors, DiscordAPIError, RESTJSONErrorCodes, MessageFlags, ActionRowBuilder, AttachmentBuilder, Message, Collection, Attachment } from 'discord.js';


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
 * @returns { Promise<Message | void> } The sent message, or void if the target is not an interaction.
 */

async function Embed(target, colour, title, description, options = {}) {
	const { client } = target
	const { fields = [], flags = [], components = [], files =[], footer = null, timestamp = false, author = false} = options;

	if(!target) {
        client.utils.LogData('Embed Utility', 'No target provided for embed.', 'error');
        return null;
    }

	if(!colour || !title || !description) {
        client.utils.LogData('Embed Utility', `Missing required parameters. Colour: ${!!colour}, Title: ${!!title}, Desc: ${!!description}`, 'error');
        return null;
    }

	const embed = new EmbedBuilder()
		.setColor(colour)
		.setTitle(title)
		.setDescription(description)
		.addFields(fields);

	if(footer) {
		embed.setFooter(footer);
	}

	if(timestamp) {
		embed.setTimestamp();
	}
	if(author) {
		embed.setAuthor({ name: author.username, iconURL: author.displayAvatarURL({ size: 512, extension: 'png' }), })
	}

	try {
		if(target instanceof BaseInteraction) {
			if(target.replied || target.deferred) {
				return await target.followUp({ embeds:[embed], components, files, flags });
			} else {
				return await target.reply({ embeds:[embed], components, files, flags });
			}
			
		} else if(target instanceof User || target instanceof GuildMember || target instanceof TextChannel) {
			return await target.send({ embeds:[embed], components, files });
		}
	} catch (error) {
		if(error instanceof DiscordAPIError && error.code === RESTJSONErrorCodes.CannotSendMessagesToThisUser) {
			console.warn(`Could not send embed to ${target.tag || target.id} - DMs are closed.`);
		} else {
			console.error(error);
		}
	}
};

export { Embed };