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
    
    const locale = interaction.locale;
    const ms = Date.now() - interaction.createdTimestamp;
    const api = Math.round(client.ws.ping);
    
    const title = client.utils.Translate('ping.title', locale);
    const description = client.utils.Translate('ping.description', locale, { ms, api });

    client.utils.Embed(interaction, 'DarkPurple', title, description, { ephemeral: true });
};