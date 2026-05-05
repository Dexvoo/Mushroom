import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, ApplicationIntegrationType, InteractionContextType } from 'discord.js';
import Client from '../../core/client.js';


export const commandData = new SlashCommandBuilder();
commandData.setName('ping');
commandData.setDescription('Replies with Pong!');
commandData.setIntegrationTypes([ ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall ]);
commandData.setContexts([ InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel ]);
commandData.setDMPermission(true);
commandData.cooldown = 5;
commandData.userPermissions = [];
commandData.botPermissions = [];
commandData.developerOnly = true;

/**
 * @param { ChatInputCommandInteraction } interaction
 * @param { Client } client
 */
export async function execute(interaction, client) {
    client.utils.Embed(interaction, 'DarkPurple', `${client.customEmojis.basic.Ping} Pong!`, `Latency: ${Date.now() - interaction.createdTimestamp}ms\nAPI Latency: ${Math.round(client.ws.ping)}ms`, { ephemeral: true });
};