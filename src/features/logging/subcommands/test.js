import { Events, ChatInputCommandInteraction, PermissionFlagsBits, MessageFlags, EmbedBuilder, Colors } from 'discord.js';
import Client from '../../../structures/extendedClient.js';
import Logs_Cache from '../cache/logs.cache.js';
import { LogsConfig } from '../models/logging.js';

/**
 * @param { ChatInputCommandInteraction & { client: Client }} interaction
 */

export async function execute(interaction) {
    const { client, options, guild, member } = interaction;

    const type = options.getString('log-type');
    const currentConfig = await Logs_Cache.get(guild.id);

    if(!currentConfig) {
        const errorMsg = client.utils.Translate('commands.log_ignore_view.no_log_config', interaction.locale, { type });
        return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), errorMsg, { flags: [ MessageFlags.Ephemeral ] });
    }

    if(type === 'all') {
        const successfulLogs = [];
        const failedLogs =[];

        const progressTitle = client.utils.Translate('commands.log_test.in_progress_title', interaction.locale);
        const progressDesc = client.utils.Translate('commands.log_test.in_progress_desc', interaction.locale, { user: interaction.member.toString() });
        client.utils.Embed(interaction, 'DarkPurple', progressTitle, progressDesc, { flags: [ MessageFlags.Ephemeral ] });
        
        for(const [logType, config] of Object.entries(currentConfig)) {
            if(!config?.enabled) continue;

            const channel = guild.channels.cache.get(config?.channelId) || (await guild.channels.fetch(config?.channelId)).catch(() => null);
            if(!channel) {
                await Logs_Cache.deleteType(guild.id, logType);
                failedLogs.push(logType);
                continue;
            }

            const botPermissions =[ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks ];
            const [ hasPermissions, missingPermissions ] = client.utils.PermissionCheck(channel, botPermissions, guild.members.me);
            if(!hasPermissions) {
                await Logs_Cache.deleteType(guild.id, logType);
                failedLogs.push(logType);
                continue;
            }
            
            const embed = new EmbedBuilder()
                .setColor('DarkPurple')
                .setTitle(client.utils.Translate('commands.log_test.test_embed_title', interaction.locale))
                .setDescription(client.utils.Translate('commands.log_test.test_embed_description', interaction.locale, { type: logType }))
                .setFooter({
                    text: client.utils.Translate('commands.log_test.test_embed_footer', interaction.locale, { user: interaction.user.tag }),
                    iconURL: interaction.user.displayAvatarURL(),
                })
                .setTimestamp();

            const sentMessage = await channel.send({ embeds: [embed] });
            if(!sentMessage) {
                await Logs_Cache.deleteType(guild.id, logType);
                failedLogs.push(logType);
                
                const failMsg = client.utils.Translate('commands.log_test.log_send_fail', interaction.locale, { channelId: config.channelId });
                return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), failMsg, { flags: [ MessageFlags.Ephemeral ] });
            }

            successfulLogs.push(logType);
        }

        const noneStr = client.utils.Translate('commands.log_test.none', interaction.locale);
        const fields =[
            { name: client.utils.Translate('commands.log_test.success_field', interaction.locale), value: successfulLogs.length > 0 ? successfulLogs.join('\n') : noneStr, inline: true },
            { name: client.utils.Translate('commands.log_test.failed_field', interaction.locale), value: failedLogs.length > 0 ? failedLogs.join('\n') : noneStr, inline: true },
        ];

        return client.utils.Embed(interaction, 'Green', client.utils.Translate('commands.log_test.complete_title', interaction.locale), '', { fields, flags: [ MessageFlags.Ephemeral ] });
    }

    const config = currentConfig[type];

    if(!config) {
        const errorMsg = client.utils.Translate('commands.log_ignore_view.no_log_config', interaction.locale, { type });
        return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), errorMsg, { flags:[ MessageFlags.Ephemeral ] });
    }

    const channel = guild.channels.cache.get(config?.channelId) || (await guild.channels.fetch(config?.channelId)).catch(() => null);
    if(!channel) {
        await Logs_Cache.deleteType(guild.id, type);
        const failMsg = client.utils.Translate('commands.log_test.log_send_fail', interaction.locale, { channelId: config.channelId });
        return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), failMsg, { flags: [ MessageFlags.Ephemeral ] });
    }
    
    const botPermissions =[ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks ];
    const [ hasPermissions, missingPermissions ] = client.utils.PermissionCheck(channel, botPermissions, guild.members.me);
    if(!hasPermissions) {
        await Logs_Cache.deleteType(guild.id, type);
        const msg = client.utils.Translate('errors.bot_missing_perms', interaction.locale, { perms: missingPermissions.flat().join(', ') });
        return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), msg, { flags: [ MessageFlags.Ephemeral ] }); 
    }

    const embed = new EmbedBuilder()
        .setColor('DarkPurple')
        .setTitle(client.utils.Translate('commands.log_test.test_embed_title', interaction.locale))
        .setDescription(client.utils.Translate('commands.log_test.test_embed_description', interaction.locale, { type }))
        .setFooter({
            text: client.utils.Translate('commands.log_test.test_embed_footer', interaction.locale, { user: interaction.user.tag }),
            iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

    const sentMessage = await channel.send({ embeds: [embed] });
    if(!sentMessage) {
        await Logs_Cache.deleteType(guild.id, type);
        const failMsg = client.utils.Translate('commands.log_test.log_send_fail', interaction.locale, { channelId: config.channelId });
        return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), failMsg, { flags:[ MessageFlags.Ephemeral ] });
    }

    const fields =[
        { name: `${type}`, value: `${config.channelId ? client.customEmojis.reactions.Yes : client.customEmojis.reactions.No}`, inline: true },
    ];

    return client.utils.Embed(interaction, 'Green', client.utils.Translate('commands.log_test.complete_title', interaction.locale), '', { fields, flags:[ MessageFlags.Ephemeral ] });
}