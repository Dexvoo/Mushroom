import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { TextChannel, GuildMember, PermissionsBitField, PermissionFlagsBits } from 'discord.js';
import Logs_Cache from '../src/features/logging/cache/logs.cache.js';
import { getLogChannel, findAuditLogExecutor } from '../src/features/logging/utils/logChannel.js';

const ALL_NEEDED = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks];

let config;
let disabled;

/** Builds a guild whose log channel and bot permissions can be controlled per test. */
function makeGuild({ channelExists = true, botPermissions = ALL_NEEDED, auditLog } = {}) {
    const guild = { id: 'g', name: 'Test Guild', channels: { cache: new Map() } };

    // Real prototypes so PermissionCheck's instanceof checks behave as in the bot
    const channel = Object.create(TextChannel.prototype);
    Object.assign(channel, { id: 'log', guild, messages: {} });
    if (channelExists) guild.channels.cache.set('log', channel);

    const me = Object.create(GuildMember.prototype);
    Object.defineProperty(me, 'permissions', { value: new PermissionsBitField(botPermissions) });
    me.permissionsIn = () => new PermissionsBitField(botPermissions);
    guild.members = { me };

    guild.fetchAuditLogs = auditLog ?? (async () => ({ entries: { find: () => undefined } }));
    return { guild, channel };
}

beforeEach(() => {
    config = { guildId: 'g', message: { enabled: true, channelId: 'log' }, ignoredChannels: ['ignored'] };
    disabled = [];
    Logs_Cache.get = async () => config;
    Logs_Cache.setType = async (guildId, type, data) => disabled.push({ type, data });
});

test('returns the log channel when everything is set up', async () => {
    const { guild, channel } = makeGuild();
    assert.equal(await getLogChannel(guild, 'message'), channel);
    assert.equal(disabled.length, 0);
});

test('returns null without disabling when the log type is not set up', async () => {
    const { guild } = makeGuild();
    assert.equal(await getLogChannel(guild, 'voice'), null);
    config.message.enabled = false;
    assert.equal(await getLogChannel(guild, 'message'), null);
    assert.equal(disabled.length, 0);
});

test('skips events from ignored channels', async () => {
    const { guild, channel } = makeGuild();
    assert.equal(await getLogChannel(guild, 'message', { sourceChannelId: 'ignored' }), null);
    assert.equal(await getLogChannel(guild, 'message', { sourceChannelId: 'other' }), channel);
    assert.equal(disabled.length, 0);
});

test('disables the log type when its channel is gone', async () => {
    const { guild } = makeGuild({ channelExists: false });
    assert.equal(await getLogChannel(guild, 'message'), null);
    assert.deepEqual(disabled, [{ type: 'message', data: { enabled: false, channelId: null } }]);
});

test('disables the log type when the bot cannot post in the channel', async () => {
    const { guild } = makeGuild({ botPermissions: [PermissionFlagsBits.ViewChannel] });
    assert.equal(await getLogChannel(guild, 'message'), null);
    assert.equal(disabled[0]?.type, 'message');
});

test('findAuditLogExecutor returns the matching entry executor', async () => {
    const moderator = { id: 'mod' };
    const entries = [
        { targetId: 'other', executor: { id: 'x' } },
        { targetId: 'target', executor: moderator },
    ];
    const { guild } = makeGuild({
        botPermissions: [...ALL_NEEDED, PermissionFlagsBits.ViewAuditLog],
        auditLog: async () => ({ entries: { find: (fn) => entries.find(fn) } }),
    });
    const executor = await findAuditLogExecutor(guild, 0, (e) => e.targetId === 'target', { delayMs: 0 });
    assert.equal(executor, moderator);
});

test('findAuditLogExecutor returns null without permission, without a match, or when the fetch fails', async () => {
    const noPermission = makeGuild().guild;
    assert.equal(await findAuditLogExecutor(noPermission, 0, () => true, { delayMs: 0 }), null);

    const withPermission = { botPermissions: [...ALL_NEEDED, PermissionFlagsBits.ViewAuditLog] };
    assert.equal(await findAuditLogExecutor(makeGuild(withPermission).guild, 0, () => false, { delayMs: 0 }), null);

    const failing = makeGuild({
        ...withPermission,
        auditLog: async () => {
            throw new Error('Missing Access');
        },
    }).guild;
    assert.equal(await findAuditLogExecutor(failing, 0, () => true, { delayMs: 0 }), null);
});
