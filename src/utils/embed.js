import { BaseInteraction, EmbedBuilder, GuildMember, TextChannel, User, Colors, DiscordAPIError, RESTJSONErrorCodes, MessageFlags, ActionRowBuilder, AttachmentBuilder } from 'discord.js';

/**
 * Create and send an embed message.
 * @param { BaseInteraction | TextChannel | User | GuildMember } target - The target to send the embed to.
 * @param { Colors } colour - The colour of the embed.
 * @param { string } title - The title of the embed.
 * @param { string } description - The description of the embed.\
 * @param { object } [options={}] Optional parameters.
 * @param { import('discord.js').APIEmbedField[] [ Options.fields=[] ] } fields - The fields of the embed.
 * @param { boolean [ Options.ephemeral=true ] } ephemeral - Whether the message should be ephemeral (only for interactions).
 * @param { ActionRowBuilder[] [ Options.components=[] ] } components - The components (buttons, select menus) to include in the message.
 * @param { AttachmentBuilder[] [ Options.files=[] ] } files - The files to attach to the message.
 * @returns { Promise<Message | void> } The sent message, or void if the target is not an interaction.
 */
async function Embed(target, colour, title, description, options = {}) {
	const { client } = target
	const { fields = [], ephemeral = true, components = [], files =[] } = options;

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

	try {
		if(target instanceof BaseInteraction) {
			if(target.replied || target.deferred) {
				return await target.followUp({ embeds: [embed], components, files, flags: [ephemeral ? MessageFlags.Ephemeral : 0] });
			} else {
				return await target.reply({ embeds: [embed], components, files, flags: [ephemeral ? MessageFlags.Ephemeral : 0] });
			}
			
		} else if(target instanceof User || target instanceof GuildMember) {
			return await target.send({ embeds: [embed], components, files });
		} else if(target instanceof TextChannel) {
			return await target.send({ embeds: [embed], components, files });
		}
	} catch (error) {
		if(error instanceof DiscordAPIError && error.code === RESTJSONErrorCodes.CannotSendMessagesToThisUser) {
			console.warn(`Could not send embed to ${target.tag || target.id} - DMs are closed.`);
		} else {
			console.error(`Failed to send embed to ${target.tag || target.id}:`, error);
		}
	}
};


export { Embed };