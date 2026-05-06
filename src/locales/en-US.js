export default {
    ping: {
        title: '🏓 Pong!',
        description: 'Latency: {ms}ms\nAPI Latency: {api}ms'
    },
    logs: {
        channelCreate: 'Channel Created by @{username}',
        channelDelete: 'Channel Deleted by @{username}',
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