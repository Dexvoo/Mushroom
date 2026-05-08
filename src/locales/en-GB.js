export default {
    ping: {
        title: '🏓 Pong!',
        description: 'Latency: {ms}ms\nAPI Latency: {api}ms'
    },
    logs: {
        channel: {
            create: 'Channel Created by @{username}',
            delete: 'Channel Deleted by @{username}',
            update: 'Channel Updated',
        },
        member: {
            add_title: 'Member Joined',
            add_description: '{member} | #{position} \nCreated: {longTimestamp} ({shortTimestamp})',
            remove_title: 'Member Left',
            remove_description: '{member}\nJoined: {longTimestamp} ({shortTimestamp})\nRoles: {roles}',
            update_title: 'Member Updated',
            user_update_title: 'User Updated',
        },
        message: {
            update_title: 'Message Updated',
            delete_title: 'Messaged Deleted in #{channel}',
            delete_noContent: `No text content`,
            bulkDelete_title: 'Message Bulk Deleted in #{channel}',
            bulkDelete_description: '{count} messages | {user}',
        },

        punishment:{
            ban_title: 'Member Banned',
            ban_description: 'User: {user}\nReason: `{reason}\nModerator: {moderator}`',
            unban_title: 'Member Unbanned',
            unban_description: 'User: {user}\nBanned Reason: `{reason}\nModerator: {moderator}`',
            timeout_title: 'Member Timeout Added',
            timeout_description: 'User: {user}\nTimeout Until: {time}\nModerator: {moderator}',
            untimeout_title: 'Member Timeout Removed',
            untimeout_description: 'User: {user}\nModerator: {moderator}',
        },
        role: {
            create: 'Role Created by @{username}',
            delete: 'Role Deleted by @{username}',
        },
        voice: {
            joined: 'Member Joined Voice Channel',
            left: `Member Left Voice Channel`,
            switched: `Member Switched Voice Channel`,
            server_undeafened: `Member Server Undeafened`,
            server_deafened: `Member Server Deafened`,
            server_unmuted: `Member Server Unmuted`,
            server_muted: `Member Server Muted`,
            video_disabled: `Member Disabled Video`,
            video_enabled: `Member Enabled Video`,
        },
    },
    errors: {
        title: `⚠️ Error`,
        no_command: 'Command not found!',
        developer_only: 'This command is only available to developers.',
        bot_missing_perms: 'I need the following permissions to execute this command:\n`{perms}`',
        user_missing_perms: 'You need the following permissions to use this command:\n`{perms}`',
        cooldown: 'Please wait {time} before using the `{command}` command again.',
    }
};