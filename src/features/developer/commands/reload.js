import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, ApplicationIntegrationType, InteractionContextType, Events, AutocompleteInteraction } from 'discord.js';
import Client from '../../../structures/extendedClient.js';
import { ENV } from '../../../bootstrap/environment.js';
import refreshCommands from '../../../structures/baseRefresh.js';



export const commandData = new SlashCommandBuilder();
commandData.setName('reload');
commandData.setDescription('(Developer) Reloads a command.');
commandData.setIntegrationTypes([ ApplicationIntegrationType.GuildInstall ]);
commandData.setContexts([ InteractionContextType.Guild ]);
commandData.addStringOption((o) => o
    .setName('command')
    .setDescription('The command to reload.')
    .setAutocomplete(true)
    .setRequired(true)
);
commandData.addBooleanOption((o) => o
    .setName('global')
    .setDescription('Set to true to be global, false is just developer guild')
    .setRequired(true)
);
commandData.cooldown = 5;
commandData.userPermissions = [];
commandData.botPermissions =[];
commandData.developerOnly = true;

/**
 * @param { AutocompleteInteraction } interaction
 */
export async function autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();

    const choices = interaction.client.commands.map((command) => command.commandData.name);
    const filtered = choices
        .filter((c) => c.toLowerCase().includes(focusedValue.toLowerCase()))
        .slice(0, 25);

    await interaction.respond(filtered.map((c) => ({ name: c, value: c })));
}

/**
 * @param { ChatInputCommandInteraction & { client: Client }} interaction
 */
export async function execute(interaction) {
    const { options, client } = interaction;

    await refreshCommands(client);

    const commandName = options.getString('command');
    const global = options.getBoolean('global');
    const command =  client.commands.get(commandName);
    if(!command) return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), `There is no command with the name \`${commandName}\`.`, { flags: [ MessageFlags.Ephemeral ]});
    
    const commandPath = command.commandData.filePath;
    if(!commandPath) return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), `Could not find the file for command \`${commandName}\`.`, { flags: [ MessageFlags.Ephemeral ]});

    const fileUrl = `${command.commandData.filePath}?t=${Date.now()}`;

    try {
        const newCommand = await import(fileUrl);

        newCommand.commandData.filePath = commandPath;
        client.commands.set(newCommand.commandData.name, newCommand);
        if(global) {
            await client.application.commands.create(newCommand.commandData);
        } else {
            await client.guilds.cache.get(ENV.DEV_GUILD_ID).commands.create(newCommand.commandData);
        }
        client.utils.Embed(interaction, 'Green', `${client.customEmojis.reactions.Yes} Command Reloaded`, '', { flags: [ MessageFlags.Ephemeral ]});
    } catch (error) {
        console.error(error);
        client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), `There was an error while reloading command \`${commandName}\`:\n\`${error.message}\``, { flags: [ MessageFlags.Ephemeral ]});
    }
}