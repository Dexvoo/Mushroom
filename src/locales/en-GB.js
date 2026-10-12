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

        autorole: {
            title: 'Auto Roles',
            list_title: 'Auto Roles',
            members_field: 'New members get',
            bots_field: 'New bots get',
            none: 'No roles',
            deleted_role: 'Deleted role',
            cannot_give: "Ovx can't give this",

            added_members: '{role} will be given to people who join.',
            added_bots: '{role} will be given to bots that join.',
            removed_members: '{role} will no longer be given to people who join.',
            removed_bots: '{role} will no longer be given to bots that join.',
            already_members: '{role} is already given to people who join.',
            already_bots: '{role} is already given to bots that join.',
            not_in_members: '{role} is not given to people who join.',
            not_in_bots: '{role} is not given to bots that join.',
            list_full: 'You can have at most {max} roles in each list.',

            everyone: "Everyone already has the {role} role, so it can't be given.",
            managed: "{role} is managed by an integration, so it can't be given out.",
            too_high:
                "{role} is at or above Ovx's highest role, so Ovx can't give it. Move Ovx's role higher in Server Settings → Roles.",

            enabled: 'Roles will be given to people and bots when they join.',
            disabled: 'Auto roles are off. The role lists are kept for when you turn them back on.',
            currently_off: 'Auto roles are currently off. Turn them on with `/autorole toggle`.',
            missing_manage_roles: 'Ovx needs the Manage Roles permission to give roles.',
        },

        welcome: {
            label_welcome: 'Welcome Message',
            label_goodbye: 'Goodbye Message',

            channel_set: '{label}s will be posted in {channel}.',
            cannot_post: 'Ovx needs these permissions in {channel} first: `{perms}`',
            currently_off: 'This message is currently off. Turn it on with `{command}`.',
            needs_channel: 'Choose a channel first with `{command}`.',
            enabled_welcome: 'A welcome message will be posted in {channel} when people join.',
            disabled_welcome: 'Welcome messages are off. Your settings are kept for when you turn them back on.',
            enabled_goodbye: 'A goodbye message will be posted in {channel} when people leave.',
            disabled_goodbye: 'Goodbye messages are off. Your settings are kept for when you turn them back on.',

            message_set: 'Message saved. See how it looks with `{command}`.',
            message_reset: 'The message is back to the default. See how it looks with `{command}`.',
            embed_on: 'The message will be sent inside an embed. See how it looks with `{command}`.',
            embed_off: 'The message will be sent as plain text. See how it looks with `{command}`.',

            test_note: 'Preview with you as the member. Only you can see this.',
            test_off: 'This message is not being posted yet: set a channel and turn it on with `{command}`.',

            field_enabled: 'On',
            field_channel: 'Channel',
            field_embed: 'Embed',
            field_title: 'Embed title',
            field_message: 'Message',
            field_message_default: 'Message (default)',
            not_set: 'Not set',
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

    tickets: {
        title: 'Tickets',
        error: 'Something went wrong with that ticket action. Try again, and if it keeps happening let a server admin know.',
        none: 'None',

        // Opening
        created: 'Your ticket is ready: {channel}',
        disabled: 'Tickets are not set up in this server. Ask a server admin to set them up.',
        no_category:
            'The ticket category is missing. Ask a server admin to choose one on the dashboard or with `/ticket setup`.',
        bot_permissions:
            'Ovx is missing permissions in the ticket category: `{perms}`. Ask a server admin to fix this.',
        limit: 'You already have {limit} open ticket(s). Close one before opening another.',
        busy: 'Your ticket is already being created.',
        unknown_type: 'This kind of ticket no longer exists. Ask a server admin to update the ticket panel.',
        not_allowed: 'You do not have a role that can open this kind of ticket.',

        // In a ticket
        not_ticket: 'This is not an open ticket.',
        staff_only: 'Only staff can do that.',
        cannot_close: 'You cannot close this ticket. Ask a staff member to close it.',
        close_confirm: 'Close this ticket? A transcript will be saved and this channel deleted.',
        close_cancelled: 'The ticket was left open.',
        closing: 'Closing the ticket and saving a transcript…',
        closed: 'Ticket closed by {user}. This channel will be deleted in {seconds} seconds.',
        already_closing: 'This ticket is already being closed.',
        transcript_failed: 'The transcript could not be saved, so the ticket was left open. {detail}',
        locked: 'Ticket locked by {user}. {owner} can still read it but cannot send messages.',
        unlocked: 'Ticket unlocked by {user}.',
        already_locked: 'This ticket is already locked.',
        not_locked: 'This ticket is not locked.',
        claimed: '{user} is handling this ticket.',
        unclaimed: '{user} is no longer handling this ticket.',
        claimed_by_other: 'This ticket is already claimed by {user}.',
        added: '{user} was added to the ticket by {by}.',
        removed: '{user} was removed from the ticket by {by}.',
        already_added: '{user} can already see this ticket.',
        not_added: '{user} was not added to this ticket.',
        not_member: '{user} is not in this server.',
        cannot_add_bot: 'Bots cannot be added to tickets.',
        cannot_remove_owner: 'The person who opened the ticket cannot be removed. Lock it instead.',
        bad_name: 'That name has no letters or numbers Discord allows in channel names.',
        renamed: 'Ticket renamed to {name}.',

        // Setup
        currently_off: 'Tickets are currently off. Turn them on with `/ticket setup enabled:True`.',
        panel_posted: 'The ticket panel was posted: {url}',
        panel_updated: 'The ticket panel was updated: {url}',
        panel_no_channel: 'Choose a text channel to post the panel in.',
        panel_bot_permissions: 'Ovx needs these permissions in {channel} first: `{perms}`',
        setup_on: 'Tickets are on. Post the "Create Ticket" message with `/ticket panel`.',
        setup_off: 'Tickets are off. Open tickets stay open, but no new ones can be created.',
        setup_needs_category: 'Choose a category for new tickets first.',
        setup_category_permissions: 'Ovx needs these permissions in {channel} first: `{perms}`',
        setup_transcript_permissions: 'Ovx needs these permissions in {channel} first: `{perms}`',
        setup_everyone: 'The everyone role cannot be a staff role, since everyone would see every ticket.',
        setup_staff_full: 'You can have at most {max} staff roles. Remove one on the dashboard first.',
        field_category: 'Category',
        field_transcripts: 'Transcripts',
        field_staff: 'Staff roles',
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
