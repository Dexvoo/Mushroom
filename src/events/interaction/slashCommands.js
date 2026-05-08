import { ChatInputCommandInteraction, ApplicationCommand, Embed, EmbedBuilder, MessageFlags, Events } from 'discord.js';
import Client from '../../core/client.js';
import { CooldownManager, CooldownType } from '../../constants/cooldowns.js';
const cooldowns = new CooldownManager();

export const name = Events.InteractionCreate;
export const once = false;
export const description = 'Registering Slash Commands / Autocomplete';

/**
 * @param { ChatInputCommandInteraction } interaction
 * @param { Client } client
 */

export async function execute(interaction, client) {
    const { guild } = interaction;

    if(interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (!command || !command.autocomplete) return;
        try {
            await command.autocomplete(interaction, client);
        } catch (error) {
            client.utils.LogData(`Autocomplete Error: ${interaction.commandName}`, error.message, 'error');
        }
    }


    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
            const msg = client.utils.Translate('errors.no_command', interaction.locale);
            return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), msg, { flags: [ MessageFlags.Ephemeral ] });
        }

        if(command.commandData.developerOnly && !client.utils.DevPermissionCheck(interaction.user.id)) {
            const msg = client.utils.Translate('errors.developer_only', interaction.locale);
            return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), msg, { flags: [ MessageFlags.Ephemeral ] });
        }

        if(!commandCooldown(interaction, command, client)) return;

        // Bot Permissions
        if(guild && command.commandData.botPermissions?.length > 0) {
            const[hasPerms, missingPerms] = client.utils.PermissionCheck(interaction, command.commandData.botPermissions, guild.members.me);
            if (!hasPerms) {
                const msg = client.utils.Translate('errors.bot_missing_perms', interaction.locale, { perms: missingPerms.flat().join(', ') });
                return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), msg, { flags: [ MessageFlags.Ephemeral ] }); 
            }
        }

        // User Permissions
        if (guild && command.commandData.userPermissions?.length > 0) {
            const[hasPerms, missingPerms] = client.utils.PermissionCheck(interaction, command.commandData.userPermissions, interaction.member);
            if (!hasPerms) {
                const msg = client.utils.Translate('errors.user_missing_perms', interaction.locale, { perms: missingPerms.flat().join(', ') });
                return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), msg, { flags: [ MessageFlags.Ephemeral ] });
            }
        }

        try {
            await command.execute(interaction, client);
        } catch (error) {

            // TODO: log errors with webhook to a private channel for better visibility and debugging, instead of just console logging.

            
            client.utils.LogData(`Command Error: ${interaction.commandName}`, error.message, 'error');

            if(interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: `${client.customEmojis.reactions.Warning} An error occurred while executing this command.`, flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: `${client.customEmojis.reactions.Warning} An error occurred while executing this command.`, flags: MessageFlags.Ephemeral });
            }
        }

        if(interaction.isMessageComponent()) return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), `This component is not functional yet.`, { flags: [ MessageFlags.Ephemeral ] });
        if(interaction.isModalSubmit()) return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), `This modal is not functional yet.`, { flags: [ MessageFlags.Ephemeral ] });

    }
};



/**
 * @param { ChatInputCommandInteraction } interaction
 * @param { ApplicationCommand } command
 * @param { Client } client
 */
function commandCooldown(interaction, command, client) {
    const { commandName, user } = interaction;
    if (cooldowns.has('Command', user.id, commandName)) {
        const timeLeft = cooldowns.getRemaining('Command', user.id, commandName);
        const locale = interaction.locale;

        const msg = client.utils.Translate('errors.cooldown', locale, { command: commandName, time: client.utils.Timestamp(timeLeft) });

        client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), msg, { flags: [ MessageFlags.Ephemeral ] });
        return false;
    }

  const cooldownAmount = command.cooldown || 5;
  cooldowns.add('Command', user.id, cooldownAmount, commandName);
  return true;
};