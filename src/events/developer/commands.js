import { ChatInputCommandInteraction, ApplicationCommand, Embed, EmbedBuilder, MessageFlags, Events, Colors } from 'discord.js';
import Client from '../../core/client.js';
import { ENV } from '../../core/env.js';

export const name = Events.InteractionCreate;
export const once = false;

/**
 * @param { ChatInputCommandInteraction & { client: Client }} interaction
 */

export async function execute(interaction) {
    const { client, guild, user, channel } = interaction;

    try{
        const LogEmbed = new EmbedBuilder()
        .setTitle(`Command Executed | Shard #${client.shard?.ids[0] ?? 0}`)
        .setColor(Colors.DarkPurple)
        .addFields(
          { name: 'User', value: `@${user.username} (${user})`, inline: true },
          ...(guild
            ? [
                { name: 'Guild', value: `${guild.name} (${guild.id})`, inline: true },
                { name: 'Channel', value: `${channel}`, inline: true },
              ]
            : []),
          {
            name: 'Command',
            value: `\`${interaction.substring(0, 1020)}\``,
            inline: false,
          }
        )
        .setTimestamp();

        await client.utils.DevEmbed('command', client, LogEmbed);

    } catch (err) {

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