export default {
    ping: {
        title: '🏓 Pong!',
        description: 'Latency: {ms}ms\nAPI Latency: {api}ms'
    },
    logs: {
        channelCreate: 'Channel Created by @{username}',
        channelDelete: 'Channel Deleted by @{username}',
        guildMemberAdd: 'Member Joined',
        guildMemberAddDescription: '{member} | #{position} \nCreated: {longTimestamp} ({shortTimestamp})',
        guildMemberRemove: 'Member Left',
        guildMemberRemoveDescription: '{member}\nJoined: {longTimestamp} ({shortTimestamp})\nRoles: {roles}',
        messageDelete: {
            title: 'Messaged Deleted in #{channel}',
            noContent: `No text content`
        },
        voice: {
            joined: 'Member Joined Voice Channel',
            left: `Member Left Voice Channel`,
            switched: `Member Switched Voice Channel`,
            serverUndeafened: `Member Server Undeafened`,
            serverDeafened: `Member Server Deafened`,
            serverUnmuted: `Member Server Unmuted`,
            serverMuted: `Member Server Muted`,
            videoDisabled: `Member Disabled Video`,
            videoEnabled: `Member Enabled Video`,
        },
    },
    errors: {
        title: `⚠️ Error`,
        noCommand: 'Command not found!',
        developerOnly: 'This command is only available to developers.',
        missingBotPerms: 'I need the following permissions to execute this command:\n`{perms}`',
        missingUserPerms: 'You need the following permissions to use this command:\n`{perms}`',
        cooldown: 'Please wait {time} before using the `{command}` command again.',
    }
};