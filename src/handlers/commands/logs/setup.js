import { Events, ChatInputCommandInteraction, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import Client from '../../../core/client.js';
import Logs_Cache from '../../../constants/cache/logs.js';
import { LogsConfig } from '../../../models/guild/logs.js';

/**
 * @param { ChatInputCommandInteraction & { client: Client }} interaction
 */

export async function execute(interaction) {
    const { client, options, guild, member } = interaction;

    const type = options.getString('log-type');
    const enabled = options.getBoolean('enabled');
    const channel = options.getChannel('channel') || null;

    // TODO: server logs
    if(type === 'server') {
        const msg = client.utils.Translate('commands.log_setup.server_logs_soon', interaction.locale);
        return interaction.client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), msg);
    }

    if(!channel && enabled) {
        const msg = client.utils.Translate('commands.log_setup.provide_channel', interaction.locale);
        return interaction.client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), msg);
    }

    if(enabled) {
        const botPermissions =[ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks ];
        const [ hasPermissions, missingPermissions ] = client.utils.PermissionCheck(channel, botPermissions, guild.members.me);
        if(!hasPermissions) {
            const msg = client.utils.Translate('errors.bot_missing_perms', interaction.locale, { perms: missingPermissions.flat().join(', ') });
            return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), msg, { flags:[ MessageFlags.Ephemeral ] }); 
        }

        try {
            const embed = new EmbedBuilder()
                .setColor('DarkPurple')
                .setTitle(client.utils.Translate('commands.log_test.test_embed_title', interaction.locale))
                .setDescription(client.utils.Translate('commands.log_test.test_embed_description', interaction.locale, { type }))
                .setFooter({
                    text: client.utils.Translate('commands.log_test.test_embed_footer', interaction.locale, { user: interaction.user.tag }),
                    iconURL: interaction.user.displayAvatarURL(),
                })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            const msg = client.utils.Translate('errors.test_log_fail_perms', interaction.locale, { channel: channel.toString() });
            return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), msg, { flags: [ MessageFlags.Ephemeral ] }); 
        }

    }

    const settings = { enabled, channelId: channel ? channel.id : null };

    try {
        if(type === 'all') {
            const allTypes = Object.keys(LogsConfig.schema.obj).filter((k) => k !== 'guildId' && k !== 'ignoredChannels');
            const updatePromises = allTypes.map((logType) =>
                Logs_Cache.setType(guild.id, logType, settings)
            );

            await Promise.all(updatePromises);
        } else {
            await Logs_Cache.setType(guild.id, type, settings);
        }
    } catch (error) {
        console.error('Failed to update log settings:', error);
        const msg = client.utils.Translate('errors.save_settings_fail', interaction.locale);
        return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), msg, { flags: [ MessageFlags.Ephemeral ] }); 
    }

    const statusKey = enabled ? 'commands.log_setup.enabled' : 'commands.log_setup.disabled';
    const statusString = client.utils.Translate(statusKey, interaction.locale);
    
    const title = client.utils.Translate('commands.log_setup.setup_success_title', interaction.locale);
    const msg = client.utils.Translate('commands.log_setup.setup_success_desc', interaction.locale, { status: statusString, type });
    
    client.utils.Embed(interaction, 'Green', title, msg, { flags: [ MessageFlags.Ephemeral ] }); 
}