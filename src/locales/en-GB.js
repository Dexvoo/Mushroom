export default {
    commands: {
        log_test: {
            in_progress_title: 'Testing in progress',
            in_progress_desc: 'User: {user}',
            test_embed_title: 'Test Log',
            test_embed_description: 'This is a test log for `{type}` logs',
            test_embed_footer: 'Tested by @{user}',
            success_field: 'Successful',
            failed_field: 'Failed',
            none: 'None',
            complete_title: 'Test Complete',
            log_send_fail: 'Failed to send test log to <#{channelId}>',
        },

        log_setup: {
            provide_channel: 'Please provide a channel to send the logs to',
            setup_success_title: 'Logs Setup Successful',
            setup_success_desc: 'Successfully {status} `{type}` logs.',
            enabled: 'enabled',
            disabled: 'disabled',
        },

        log_view: {
            all_title: 'Current Logs Configurations',
            requested_by: 'Requested by {user}',
            single_title: 'Current Configuration for {type} Logs',
            field_enabled: 'Enabled',
            field_channel: 'Channel',
            not_set: 'Not set',
        },

        log_ignore: {
            title: 'Channel Ignored',
            ignored_desc: 'Logs will now ignore events from {channel}.',
            resumed_title: 'Channel Resumed',
            resumed_desc: 'Logs will now resume for events from {channel}.',
            already_ignored: '{channel} is already on the ignored list.',
            not_ignored: '{channel} is not on the log ignore list.',
        },

        log_ignore_view: {
            title: 'Current Ignored Channels',
            no_channels: 'There are no channels on the log ignore list.',
            no_log_config: 'No current config found for `{type}`',
        },

        level_rank: {
            not_configured_prompt: 'This guild has not configured levels yet. Ask an admin to use `/levels setup`.',
            bot: '{user} is a bot and cannot gain XP.',
            not_levelled_yet: '{user} does not have a level yet.',
        },

        level_leaderboard: {
            invalid_type: 'Invalid leaderboard type provided.',
            empty_title: 'Leaderboard Empty',
            empty_description: 'There is no leaderboard data to display yet.',
            title: '{guild} | {type} Leaderboard 🏆',
        },

        level_setup: {
            provide_channel: 'Please provide a channel to send the level embed to',
            test_embed_title: 'Test Levels',
            test_embed_description: 'This is a test embed for `levels`',
            test_embed_footer: 'Tested by @{user}',
            test_send_fail: 'Failed to send test log to <#{channelId}>',

            success_title: 'Levels Setup Successful',
            success_description: 'Successfully updated the levels configuration.',
            disabled: 'The leveling system has been disabled.',
            enabled: 'The leveling system has been enabled.',
        },

        ping: {
            title: '🏓 Pong!',
            description: 'Latency: {ms}ms\nAPI Latency: {api}ms',
        },
    },

    logs: {
        channel: {
            create: 'Channel Created by @{username}',
            delete: 'Channel Deleted by @{username}',
            update: 'Channel Updated',
        },

        member: {
            add_title: 'Member Joined',
            add_description: '{member} | #{position}\nCreated: {longTimestamp} ({shortTimestamp})',

            remove_title: 'Member Left',
            remove_description: '{member}\nJoined: {longTimestamp} ({shortTimestamp})\nRoles: {roles}',

            update_title: 'Member Updated',
            user_update_title: 'User Updated',
        },

        message: {
            update_title: 'Message Updated',

            delete_title: 'Message Deleted in #{channel}',
            delete_noContent: 'No text content',

            bulkDelete_title: 'Messages Bulk Deleted in #{channel}',
            bulkDelete_description: '{count} messages | {user}',
        },

        punishment: {
            ban_title: 'Member Banned',
            ban_description: 'User: {user}\nReason: `{reason}`\nModerator: {moderator}',

            unban_title: 'Member Unbanned',
            unban_description: 'User: {user}\nBan Reason: `{reason}`\nModerator: {moderator}',

            timeout_title: 'Member Timeout Added',
            timeout_description: 'User: {user}\nTimeout Until: {time}\nModerator: {moderator}',

            untimeout_title: 'Member Timeout Removed',
            untimeout_description: 'User: {user}\nModerator: {moderator}',
        },

        server: {
            update: 'Server Updated',
            emoji_create: 'Emoji Created',
            emoji_delete: 'Emoji Deleted',
            emoji_update: 'Emoji Updated',
            sticker_create: 'Sticker Created',
            sticker_delete: 'Sticker Deleted',
            sticker_update: 'Sticker Updated',
        },

        role: {
            create: 'Role Created by @{username}',
            delete: 'Role Deleted by @{username}',
        },

        voice: {
            joined: 'Member Joined Voice Channel',
            left: 'Member Left Voice Channel',
            switched: 'Member Switched Voice Channel',

            server_undeafened: 'Member Server Undeafened',
            server_deafened: 'Member Server Deafened',

            server_unmuted: 'Member Server Unmuted',
            server_muted: 'Member Server Muted',

            video_disabled: 'Member Disabled Video',
            video_enabled: 'Member Enabled Video',
        },
    },

    levels: {
        level_up_default: '{user} leveled up to **{level}**!',
        rewards_added: 'Added Rewards',
        rewards_removed: 'Removed Rewards',
        rewards_failed: 'Failed Rewards',
    },

    errors: {
        title: '⚠️ Error',
        no_command: 'Command not found!',
        developer_only: 'This command is only available to developers.',

        bot_missing_perms: 'I need the following permissions to execute this command:\n`{perms}`',
        user_missing_perms: 'You need the following permissions to use this command:\n`{perms}`',

        cooldown: 'Please wait {time} before using the `{command}` command again.',

        no_subcommand: 'The subcommand `{subcommand}` does not exist.',

        save_settings_fail: 'An error occurred while saving the settings.',

        no_config_found_generic: 'No configuration found for this server.',

        invalid_channel: 'That channel is invalid.',
        invalid_user: 'That user is invalid.',
        invalid_role: 'That role is invalid.',

        unexpected: 'An unexpected error occurred.',
    },
};
