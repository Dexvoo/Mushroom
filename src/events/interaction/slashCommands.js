import { ChatInputCommandInteraction, ApplicationCommand, Embed, EmbedBuilder, MessageFlags } from 'discord.js';
import Client from '../../core/client.js';
import { CooldownManager, CooldownType } from '../../constants/cooldowns.js';
const cooldowns = new CooldownManager();

export const name = 'interactionCreate';
export const once = false;

/**
 * @param { ChatInputCommandInteraction } interaction
 * @param { Client } client
 */

export async function execute(interaction, client) {
    const { guild } = interaction;
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return await interaction.reply({ content: `${client.customEmojis.reactions.No} Command not found!`, flags: MessageFlags.Ephemeral });

    if(command.commandData.developerOnly && !client.utils.DevPermissionCheck(interaction.user.id)) {
        return client.utils.Embed(interaction, 'Red', `${client.customEmojis.reactions.Warning} Developer Only`, `You do not have permission to use this command.`, { ephemeral: true });
    }

    if(!commandCooldown(interaction, command, client)) return;

    // Bot Permissions
    if(guild && command.botPermissions?.length > 0) {
        const[hasPerms, missingPerms] = client.utils.PermissionCheck(interaction, command.commandData.botPermissions, guild.members.me);
        if (!hasPerms) return client.utils.Embed(interaction, 'Red', `${client.customEmojis.reactions.Warning} Missing Bot Permissions`, `I need the following permissions to execute this command:\n\`${missingPerms.flat().join(', ')}\``, { ephemeral: true });
    }

    // User Permissions
    if (guild && command.commandData.userPermissions?.length > 0) {
        const[hasPerms, missingPerms] = client.utils.PermissionCheck(interaction, command.commandData.userPermissions, interaction.member);
        if (!hasPerms) return client.utils.Embed(interaction, 'Red', `${client.customEmojis.reactions.Warning} Missing User Permissions`, `You need the following permissions to use this command:\n\`${missingPerms.flat().join(', ')}\``, { ephemeral: true });
    }

    try {
        await command.execute(interaction, client);
    } catch (error) {
        client.utils.LogData(`Command Error: ${interaction.commandName}`, error.message, 'error');

        if(interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: `${client.customEmojis.reactions.Warning} An error occurred while executing this command.`, flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: `${client.customEmojis.reactions.Warning} An error occurred while executing this command.`, flags: MessageFlags.Ephemeral });
        }
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

        client.utils.Embed(interaction, 'Red', `Command Cooldown`, `\`${commandName}\` ${client.utils.Timestamp(timeLeft)}`, { ephemeral: true });
        return false;
    }

  const cooldownAmount = command.cooldown || 5;
  cooldowns.add('Command', user.id, cooldownAmount, commandName);
  return true;
};