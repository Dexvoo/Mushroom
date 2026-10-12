export default {
    commands: {
        level_rank: {
            not_configured_prompt:
                'Levels are not set up in this server yet. A server admin can turn them on with `/dashboard`.',
            bot: '{user} is a bot and cannot gain XP.',
            not_levelled_yet: '{user} does not have a level yet.',
        },

        level_leaderboard: {
            invalid_type: 'Invalid leaderboard type provided.',
            empty_title: 'Leaderboard Empty',
            empty_description: 'There is no leaderboard data to display yet.',
            title: '{guild} | {type} Leaderboard 🏆',
        },

        dashboard: {
            title: 'Ovx Dashboard',
            description:
                "Levels, logs, tickets, welcome messages, auto roles, stream alerts and the bot's look are all set up on the dashboard. You need the Manage Server permission to change them.",
            button: 'Open settings',
            offline: 'The dashboard is not available right now.',
        },

        moderation: {
            title: 'Moderation',
            no_reason: 'No reason given',
            reason_field: 'Reason',

            user_missing_perms: 'You need these permissions: `{perms}`',
            bot_missing_perms: 'Ovx needs these permissions first: `{perms}`',
            not_member: '{user} is not in this server.',
            target_self: 'You cannot do that to yourself.',
            target_bot_self: 'Ovx cannot do that to itself.',
            use_dashboard_nickname: "Change Ovx's nickname on the dashboard, under Bot Settings.",
            target_owner: 'Nobody can do that to the server owner.',
            target_higher_than_you: "{user}'s highest role is the same as or above yours.",
            target_higher_than_bot:
                "{user}'s highest role is the same as or above Ovx's. Move Ovx's role higher in Server Settings > Roles.",
            target_admin: '{user} is an administrator, and Discord does not allow timing out administrators.',
            action_failed: 'Discord refused: {error}',

            already_banned: '{user} is already banned.',
            not_banned: '{user} is not banned.',
            not_muted: '{user} is not muted.',
            bad_duration: 'That is not a length of time. Try something like `10m`, `1h 30m` or `2d`.',
            duration_range: 'A mute can be from 10 seconds up to 28 days.',
            purge_channel: 'Messages cannot be purged in this channel.',
            purge_none: 'There are no messages to delete. Pinned messages and messages older than 14 days are skipped.',
            purge_fewer:
                'Some were skipped: pinned messages, and messages older than 14 days (Discord does not allow bulk-deleting those).',

            banned: '{user} was banned.\nReason: {reason}',
            unbanned: '{user} was unbanned.',
            kicked: '{user} was kicked.\nReason: {reason}',
            muted: '{user} is muted for {duration} (until {until}).\nReason: {reason}',
            unmuted: '{user} is no longer muted.',
            purged: 'Deleted {count} message(s).',
            purged_user: "Deleted {count} of {user}'s message(s).",
            nickname_set: "{user}'s nickname is now **{nickname}**.",
            nickname_reset: "{user}'s nickname was reset.",
            dm_failed: 'They could not be sent a message (their DMs are closed).',

            case_line: 'Case #{number}',
            case_save_failed: 'The warning could not be saved. Try again in a moment.',
            warn_bot: 'Bots cannot be warned.',
            warned: '{user} was warned. They now have {count} warning(s).\nReason: {reason}',
            no_warning_case: 'There is no warning with case number #{number}. Check `/moderation history`.',
            unwarned: 'Warning #{number} was removed from {user}.',
            purge_everyone: 'Everyone',

            auto_done: '⚡ They reached {warnings} warnings, so they were automatically {action}.',
            auto_missing_perms:
                '⚠️ They reached {warnings} warnings, but Ovx could not have them {action}: it is missing the permission.',
            auto_not_allowed:
                "⚠️ They reached {warnings} warnings, but Ovx could not have them {action}: their role is the same as or above Ovx's, or they are an administrator.",
            auto_failed: '⚠️ They reached {warnings} warnings, but Discord refused to have them {action}: {error}',
            auto_mute: 'muted for {duration}',
            auto_kick: 'kicked',
            auto_ban: 'banned',

            history_title: "{user}'s history",
            history_empty: '{user} has no warnings, mutes, kicks or bans.',
            history_totals: '**{warn}** warnings · **{mute}** mutes · **{kick}** kicks · **{ban}** bans',
            history_more: '{count} older case(s). The full history is on the dashboard (`/dashboard`).',
            history_by: 'by @{moderator}',
            action_warn: 'Warning',
            action_ban: 'Ban',
            action_unban: 'Unban',
            action_kick: 'Kick',
            action_mute: 'Mute',
            action_unmute: 'Unmute',

            dm_warn: 'You were warned in **{server}**.',
            dm_ban: 'You were banned from **{server}**.',
            dm_kick: 'You were kicked from **{server}**.',
            dm_mute: 'You were muted in **{server}** for {duration}.',
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

            kick_title: 'Member Kicked',
            kick_description: 'User: {user}\nReason: `{reason}`\nModerator: {moderator}',

            warn_title: 'Member Warned',
            warn_description:
                'User: {user}\nReason: `{reason}`\nModerator: {moderator}\nCase: #{case} · Warning {count}',

            unwarn_title: 'Warning Removed',
            unwarn_description: 'User: {user}\nWarning: `{reason}`\nRemoved by: {moderator}\nCase: #{case}',

            purge_title: 'Messages Purged',
            purge_description: '{count} message(s) deleted in {channel}\nFrom: {from}\nModerator: {moderator}',
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
        no_category: 'The ticket category is missing. Ask a server admin to choose one on the dashboard.',
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
