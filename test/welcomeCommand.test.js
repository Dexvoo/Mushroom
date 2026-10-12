import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Collection, MessageFlags } from 'discord.js';
import { stubEnvironment } from './helpers/env.js';
import Welcome_Cache from '../src/features/welcome/cache/welcome.cache.js';
import Guild_Settings_Cache from '../src/shared/cache/guildSettings.cache.js';
import { AuditLog } from '../src/dashboard/models/auditLog.js';

const GUILD_ID = '400000000000000001';
const CHANNEL_ID = '500000000000000001';
/** @type {any} */
let en;
/** @type {{ welcome: any, goodbye: any }} */
let commands;
let config;
let recorded;

before(async () => {
    // The commands reach the environment module through the Translate helper
    stubEnvironment({});
    ({ default: en } = await import('../src/locales/en-GB.js'));
    commands = {
        welcome: await import('../src/features/welcome/commands/welcome.js'),
        goodbye: await import('../src/features/welcome/commands/goodbye.js'),
    };
});

beforeEach(() => {
    config = Welcome_Cache.createDefault(GUILD_ID);
    recorded = [];
    Welcome_Cache.get = async () => config;
    Welcome_Cache.set = async (guildId, updates) => (config = { ...config, ...updates });
    Guild_Settings_Cache.get = async (guildId) => ({ guildId, embedColour: null, bio: null });
    AuditLog.create = async (entry) => void recorded.push(entry);
});

/** Translations without placeholders filled, enough to tell replies apart. */
const translate = (key) => key.split('.').reduce((value, part) => value?.[part], en) ?? key;

/**
 * @param {string} subcommand
 * @param {{ options?: Record<string, any>, canManage?: boolean, canPost?: boolean, kind?: string }} [setup]
 */
function makeInteraction(subcommand, { options = {}, canManage = true, canPost = true, kind = 'welcome' } = {}) {
    const replies = [];
    const channel = { id: CHANNEL_ID, name: 'welcome', toString: () => `<#${CHANNEL_ID}>` };
    const guild = {
        id: GUILD_ID,
        name: 'Drift Kings',
        memberCount: 10,
        channels: { cache: new Collection([[CHANNEL_ID, channel]]) },
        roles: { cache: new Collection() },
        members: {
            me: { permissionsIn: () => ({ missing: () => (canPost ? [] : ['SendMessages']) }) },
        },
    };
    const member = {
        id: '42',
        displayName: 'Tester',
        user: { username: 'tester', displayName: 'Tester', bot: false },
        guild,
        displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/1.png',
    };
    const client = {
        customEmojis: { reactions: { Yes: 'yes', No: 'no' } },
        utils: {
            Translate: translate,
            PermissionCheck: async () => (canManage ? [true, []] : [false, ['ManageGuild']]),
            Embed: async (_target, colour, title, description, extra) =>
                void replies.push({ colour, title, description, fields: extra?.fields }),
        },
    };
    const values = { channel, ...options };

    return {
        replies,
        interaction: {
            client,
            guild,
            member,
            guildId: GUILD_ID,
            locale: 'en-GB',
            commandName: kind,
            user: { id: '42', username: 'tester', displayName: 'Tester', displayAvatarURL: () => 'x' },
            options: {
                getSubcommand: () => subcommand,
                getSubcommandGroup: () => null,
                getChannel: () => values.channel,
                getBoolean: (name) => values[name],
                getString: (name) => values[name] ?? null,
            },
            reply: async (payload) => void replies.push(payload),
        },
    };
}

const run = (kind, subcommand, setup = {}) => {
    const made = makeInteraction(subcommand, { ...setup, kind });
    return commands[kind].execute(made.interaction).then(() => made.replies);
};

test('both commands build valid slash command data', () => {
    for (const kind of ['welcome', 'goodbye']) {
        const data = commands[kind].commandData.toJSON();
        assert.equal(data.name, kind);
        assert.deepEqual(
            data.options.map((option) => option.name),
            ['channel', 'toggle', 'message', 'embed', 'test', 'view']
        );
    }
});

test('a full setup through commands, each step recorded in the Web Logs', async () => {
    await run('welcome', 'channel');
    await run('welcome', 'toggle', { options: { enabled: true } });
    await run('welcome', 'message', { options: { text: 'Hi {user}!\\nRead the rules.' } });
    await run('welcome', 'embed', { options: { enabled: true, title: 'Welcome {displayName}' } });

    assert.deepEqual(config.welcome, {
        enabled: true,
        channelId: CHANNEL_ID,
        message: 'Hi {user}!\nRead the rules.',
        embed: true,
        title: 'Welcome {displayName}',
    });
    assert.deepEqual(
        recorded.map((entry) => [entry.source, entry.changes]),
        [
            ['/welcome channel', ['Welcome channel: none → #welcome']],
            ['/welcome toggle', ['Welcome messages: off → on']],
            ['/welcome message', ['Welcome message changed']],
            ['/welcome embed', ['Welcome embed: off → on', 'Welcome embed title changed']],
        ]
    );
});

test('/goodbye changes the goodbye message only', async () => {
    await run('goodbye', 'message', { options: { text: 'See you, {username}' } });
    assert.equal(config.goodbye.message, 'See you, {username}');
    assert.equal(config.welcome.message, null);
    assert.equal(recorded[0].source, '/goodbye message');
});

test('a channel the bot cannot post in is refused, and messages need a channel before they can be on', async () => {
    const refused = await run('welcome', 'channel', { canPost: false });
    assert.equal(refused[0].colour, 'Red');

    const noChannel = await run('welcome', 'toggle', { options: { enabled: true } });
    assert.equal(noChannel[0].description, en.commands.welcome.needs_channel);
    assert.equal(config.welcome.enabled, false);
    assert.equal(recorded.length, 0);
});

test('leaving the text out goes back to the default, and "none" removes the embed title', async () => {
    config.welcome = { ...config.welcome, message: 'Custom', title: 'Old title', embed: true };
    await run('welcome', 'message');
    assert.equal(config.welcome.message, null);

    await run('welcome', 'embed', { options: { enabled: true, title: 'None' } });
    assert.equal(config.welcome.title, null);
});

test('test shows a private preview that pings nobody', async () => {
    config.welcome = { enabled: true, channelId: CHANNEL_ID, message: 'Hi {user}', embed: false, title: null };
    const [reply] = await run('welcome', 'test');

    assert.equal(reply.flags, MessageFlags.Ephemeral);
    assert.deepEqual(reply.allowedMentions, { parse: [] });
    assert.match(reply.content, /Hi <@42>$/);
    assert.equal(recorded.length, 0, 'previews are not logged');
});

test('view shows the settings, with the default text when none is set', async () => {
    const [reply] = await run('goodbye', 'view');
    const messageField = reply.fields.at(-1);
    assert.equal(messageField.name, en.commands.welcome.field_message_default);
    assert.match(messageField.value, /has left the server/);
});

test('every subcommand needs Manage Server', async () => {
    for (const subcommand of ['channel', 'toggle', 'message', 'embed', 'test', 'view']) {
        const replies = await run('welcome', subcommand, { canManage: false, options: { enabled: true } });
        assert.equal(replies[0].colour, 'Red', subcommand);
    }
    assert.equal(config.welcome.channelId, null);
    assert.equal(recorded.length, 0);
});
