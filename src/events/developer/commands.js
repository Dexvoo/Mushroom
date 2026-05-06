import { ChatInputCommandInteraction, ApplicationCommand, Embed, EmbedBuilder, MessageFlags, Events, Colors, ApplicationCommandOptionType } from 'discord.js';
import Client from '../../core/client.js';
import { ENV } from '../../core/env.js';

export const name = Events.InteractionCreate;
export const once = false;
export const description = 'Developer Command Logs';

/**
 * @param { ChatInputCommandInteraction & { client: Client }} interaction
 */

export async function execute(interaction) {
    const { client, guild, user, channel } = interaction;

    if(!interaction.isCommand()) return;

    try{
        const commandText = buildCommandText(interaction);
        const LogEmbed = new EmbedBuilder()
        .setTitle(`Command Executed | Shard #${client.shard?.ids[0] ?? 0}`)
        .setColor(Colors.DarkPurple)
        .addFields(
            { name: 'User', value: `@${user.username} (${user})`, inline: true },
                ...(guild ? 
                [
                    { name: 'Guild', value: `${guild.name} (${guild.id})`, inline: true },
                    { name: 'Channel', value: `${channel}`, inline: true },
                ]
                : []),
            {
                name: 'Command',
                value: `\`${commandText.substring(0, 1020)}\``,
                inline: false,
            }
        )
        .setTimestamp();

        await client.utils.DevEmbed('command', client, LogEmbed);

    } catch (err) {

    }
    
};


/**
 * @param { ChatInputCommandInteraction & { client: Client }} interaction
 */

function buildCommandText(interaction) {
    const parts =[`/${interaction.commandName}`];

    const processOptions = (options =[]) => {
        for (const opt of options) {
            if (opt.type === ApplicationCommandOptionType.SubcommandGroup || opt.type === ApplicationCommandOptionType.Subcommand) {
                parts.push(opt.name);
                processOptions(opt.options);
            } else {
                parts.push(`${opt.name}:${opt.value}`);
            }
        }
    };

  processOptions(interaction.options?.data);
  return parts.join(' ');
};