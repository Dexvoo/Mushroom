import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, ApplicationIntegrationType, InteractionContextType, Events } from 'discord.js';
import Client from '../../../structures/extendedClient.js';


export const commandData = new SlashCommandBuilder();
commandData.setName('ping');
commandData.setDescription('Replies with Pong!');
commandData.setIntegrationTypes([ ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall ]);
commandData.setContexts([ InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel ]);
commandData.setDMPermission(true);
commandData.cooldown = 5;
commandData.userPermissions = [];
commandData.botPermissions = [];
commandData.developerOnly = false;

/**
 * @param { ChatInputCommandInteraction & { client: Client }} interaction
 */
export async function execute(interaction) {
    const { locale, createdTimestamp, client } = interaction
    const ms = Date.now() - createdTimestamp;
    const api = Math.round(client.ws.ping);
    const title = client.utils.Translate('commands.ping.title', locale);
    const description = client.utils.Translate('commands.ping.description', locale, { ms, api });

    client.utils.Embed(interaction, 'DarkPurple', title, description, { flags: [ MessageFlags.Ephemeral ] });
};