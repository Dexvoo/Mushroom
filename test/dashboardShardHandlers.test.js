import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ChannelType, Collection, DiscordAPIError, RESTJSONErrorCodes } from 'discord.js';
import Guild_Level_Cache from '../src/features/levels/cache/guildLevels.cache.js';
import User_Levels_Cache from '../src/features/levels/cache/userLevels.cache.js';
import Logs_Cache from '../src/features/logging/cache/logs.cache.js';
import Guild_Settings_Cache from '../src/shared/cache/guildSettings.cache.js';
import { handle } from '../src/dashboard/shardHandlers.js';
import { ALLOWED_SIZES } from '@discordjs/rest';

const GUILD_ID = '400000000000000001';
const MANAGER = '300000000000000001';
const MEMBER = '300000000000000002';
const STRANGER = '300000000000000003';
const TEXT = '500000000000000001';
const ROLE = '600000000000000001';

let config;
let saved;
let botSettings;
let storedSettings;

/** Image links throw on sizes Discord doesn't serve, like discord.js does. */
function checkSize(options) {
    if (options?.size !== undefined && !ALLOWED_SIZES.includes(options.size)) {
        throw new RangeError(`Invalid size provided: ${options.size}`);
    }
}

/**
 * The bot's own member in the fake guild.
 * Also accepts editMe options, where the nickname is called nick.
 * @param {{ nickname?: string | null, nick?: string | null, avatar?: string | null, banner?: string | null,
 *   canChangeNickname?: boolean }} [state]
 */
function fakeMe({ nickname = null, nick, avatar = null, banner = null, canChangeNickname = true } = {}) {
    return {
        nickname: nick !== undefined ? nick : nickname,
        avatar,
        banner,
        roles: { highest: { position: 10 } },
        permissions: { has: () => canChangeNickname },
        permissionsIn: () => ({ has: () => true }),
        avatarURL: (options) => (checkSize(options), avatar ? 'https://cdn.discordapp.com/guilds/avatar.png' : null),
        bannerURL: (options) => (checkSize(options), banner ? 'https://cdn.discordapp.com/guilds/banner.png' : null),
        displayAvatarURL: (options) =>
            (checkSize(options) ?? avatar)
                ? 'https://cdn.discordapp.com/guilds/avatar.png'
                : 'https://cdn.discordapp.com/avatars/1/default.png',
    };
}

/**
 * @param {{ canChangeNickname?: boolean, editMe?: (options: any) => Promise<any>, me?: object }} [options]
 */
function makeClient({ canChangeNickname = true, editMe, me = {} } = {}) {
    const members = {
        [MANAGER]: {
            id: MANAGER,
            user: { username: 'manager' },
            displayName: 'Manager',
            permissions: { has: () => true },
            displayAvatarURL: () => null,
        },
        [MEMBER]: { displayName: 'Member', permissions: { has: () => false }, displayAvatarURL: () => null },
    };
    const channel = {
        id: TEXT,
        name: 'general',
        type: ChannelType.GuildText,
        rawPosition: 0,
        parent: null,
        isThread: () => false,
        isVoiceBased: () => false,
        isTextBased: () => true,
    };
    const guild = {
        id: GUILD_ID,
        name: 'Test',
        memberCount: 3,
        iconURL: () => null,
        channels: { cache: new Collection([[TEXT, channel]]) },
        roles: {
            cache: new Collection([
                [GUILD_ID, { id: GUILD_ID, name: '@everyone', position: 0, managed: false, hexColor: '#000000' }],
                [ROLE, { id: ROLE, name: 'Regular', position: 1, managed: false, hexColor: '#a78bfa' }],
            ]),
        },
        members: {
            cache: new Collection(Object.entries(members)),
            me: fakeMe({ canChangeNickname, ...me }),
            editMe: editMe ?? (async (options) => fakeMe(options)),
            async fetch({ user }) {
                if (Array.isArray(user)) return new Collection();
                if (!members[user]) throw new Error('Unknown Member');
                return members[user];
            },
        },
    };
    guild.client = {
        user: {
            username: 'Ovx',
            displayAvatarURL: (options) => checkSize(options) ?? 'https://cdn.discordapp.com/avatars/1/default.png',
        },
    };
    return { guilds: { cache: new Collection([[GUILD_ID, guild]]) } };
}

beforeEach(() => {
    config = {
        guildId: GUILD_ID,
        _id: 'internal',
        enabled: false,
        channelId: null,
        levelUpMessage: null,
        messageCooldown: 60,
        maxLevel: 100,
        removePastRewards: false,
        publicLeaderboard: false,
        rewards: [],
        blacklisted: { roleIds: [], channelIds: [] },
    };
    saved = [];
    Guild_Level_Cache.get = async () => config;
    Guild_Level_Cache.set = async (guildId, updates) => {
        saved.push({ guildId, updates });
        return { ...config, ...updates };
    };
    Logs_Cache.get = async () => ({ guildId: GUILD_ID });
    botSettings = { guildId: GUILD_ID, bio: null, embedColour: null };
    storedSettings = [];
    Guild_Settings_Cache.get = async () => botSettings;
    Guild_Settings_Cache.set = async (guildId, updates) => {
        storedSettings.push(updates);
        botSettings = { ...botSettings, ...updates };
        return botSettings;
    };
    User_Levels_Cache.getTopUsers = async () => [
        { userId: MEMBER, level: 2, xp: 300, totalMessages: 10, totalVoice: 5, totalCommands: 1 },
    ];
});

test('unknown actions are refused', async () => {
    const result = await handle(makeClient(), 'constructor', {});
    assert.deepEqual(result, { ok: false, status: 400, error: 'Unknown action' });
});

test('only members with Manage Server can open the settings', async () => {
    const client = makeClient();
    assert.equal((await handle(client, 'guildOverview', { guildId: GUILD_ID, userId: MEMBER })).status, 403);
    assert.equal((await handle(client, 'guildOverview', { guildId: GUILD_ID, userId: STRANGER })).status, 403);
    assert.equal((await handle(client, 'guildOverview', { guildId: 'bad', userId: MANAGER })).status, 404);
    assert.equal((await handle(client, 'guildOverview', { guildId: GUILD_ID, userId: undefined })).status, 401);
});

test('the overview has guild data and settings, without internal fields', async () => {
    const result = await handle(makeClient(), 'guildOverview', { guildId: GUILD_ID, userId: MANAGER });

    assert.equal(result.ok, true);
    assert.equal(result.data.guild.name, 'Test');
    assert.deepEqual(
        result.data.channels.map((c) => [c.id, c.type, c.botCanPost]),
        [[TEXT, 'text', true]]
    );
    assert.deepEqual(
        result.data.roles.map((r) => r.id),
        [ROLE],
        'everyone role left out'
    );
    assert.equal('_id' in result.data.levels, false);
    assert.equal('guildId' in result.data.levels, false);
});

test('saving validates, then writes through the guild cache', async () => {
    const result = await handle(makeClient(), 'saveLevelSettings', {
        guildId: GUILD_ID,
        userId: MANAGER,
        settings: { enabled: true, channelId: TEXT, rewards: [{ level: 5, roleId: ROLE }] },
    });

    assert.equal(result.ok, true);
    assert.deepEqual(saved, [
        {
            guildId: GUILD_ID,
            updates: { enabled: true, channelId: TEXT, rewards: [{ level: 5, roleId: ROLE }] },
        },
    ]);
});

test('invalid settings are rejected with reasons and nothing is saved', async () => {
    const result = await handle(makeClient(), 'saveLevelSettings', {
        guildId: GUILD_ID,
        userId: MANAGER,
        settings: { maxLevel: 0 },
    });

    assert.equal(result.status, 400);
    assert.equal(result.details.length, 1);
    assert.equal(saved.length, 0);
});

test('members without Manage Server cannot save', async () => {
    const result = await handle(makeClient(), 'saveLevelSettings', {
        guildId: GUILD_ID,
        userId: MEMBER,
        settings: { enabled: false },
    });
    assert.equal(result.status, 403);
    assert.equal(saved.length, 0);
});

test('public leaderboards are hidden unless the server opted in', async () => {
    const client = makeClient();
    const request = { guildId: GUILD_ID, type: 'level', limit: 50 };

    const hidden = await handle(client, 'leaderboard', request);
    assert.deepEqual(hidden, { ok: false, status: 404, error: 'Leaderboard not found' });

    const unknownGuild = await handle(client, 'leaderboard', { ...request, guildId: '400000000000000099' });
    assert.deepEqual(unknownGuild, hidden, 'same response, so server IDs cannot be probed');

    config.publicLeaderboard = true;
    const shown = await handle(client, 'leaderboard', request);
    assert.equal(shown.ok, true);
    assert.equal(shown.data.entries[0].name, 'Member');
    assert.equal(shown.data.entries[0].rank, 1);
});

test('managers can preview a private leaderboard; others cannot', async () => {
    const client = makeClient();
    const preview = await handle(client, 'leaderboard', { guildId: GUILD_ID, type: 'level', viewerId: MANAGER });
    assert.equal(preview.ok, true);

    const denied = await handle(client, 'leaderboard', { guildId: GUILD_ID, type: 'level', viewerId: MEMBER });
    assert.equal(denied.status, 403);
});

test('unknown leaderboard types are rejected', async () => {
    const result = await handle(makeClient(), 'leaderboard', { guildId: GUILD_ID, type: 'xp; drop' });
    assert.equal(result.status, 400);
});

test('botGuilds only reports servers on this shard and rejects bad input', async () => {
    const client = makeClient();
    assert.deepEqual((await handle(client, 'botGuilds', { guildIds: [GUILD_ID, '400000000000000099', 42] })).data, [
        GUILD_ID,
    ]);
    assert.equal((await handle(client, 'botGuilds', { guildIds: 'nope' })).status, 400);
});

// ---------- Logging ----------

test('the overview includes logging settings for every log type', async () => {
    Logs_Cache.get = async () => ({
        guildId: GUILD_ID,
        message: { enabled: true, channelId: TEXT },
        join: { enabled: true, channelId: TEXT },
        member: { enabled: true, channelId: TEXT },
    });
    const result = await handle(makeClient(), 'guildOverview', { guildId: GUILD_ID, userId: MANAGER });

    assert.deepEqual(Object.keys(result.data.logging.types), [
        'message',
        'channel',
        'member',
        'join',
        'leave',
        'voice',
        'role',
        'server',
        'punishment',
    ]);
    assert.deepEqual(result.data.logging.types.message, { enabled: true, channelId: TEXT });
    // Leave logs were never set up, so they show the member log settings they still follow
    assert.deepEqual(result.data.logging.types.leave, { enabled: true, channelId: TEXT });
    assert.deepEqual(result.data.logging.types.voice, { enabled: false, channelId: null });
    assert.deepEqual(result.data.logging.ignoredChannels, []);
});

test('saving logging settings validates, then writes through the logs cache', async () => {
    const writes = [];
    Logs_Cache.set = async (guildId, updates) => {
        writes.push({ guildId, updates });
        return { guildId, ...updates };
    };

    const ok = await handle(makeClient(), 'saveLoggingSettings', {
        guildId: GUILD_ID,
        userId: MANAGER,
        settings: { types: { member: { enabled: true, channelId: TEXT } } },
    });
    assert.equal(ok.ok, true);
    assert.deepEqual(writes, [{ guildId: GUILD_ID, updates: { member: { enabled: true, channelId: TEXT } } }]);
    assert.deepEqual(ok.data.types.member, { enabled: true, channelId: TEXT });

    const denied = await handle(makeClient(), 'saveLoggingSettings', {
        guildId: GUILD_ID,
        userId: MEMBER,
        settings: { types: { member: { enabled: false, channelId: null } } },
    });
    assert.equal(denied.status, 403);
    assert.equal(writes.length, 1, 'nothing saved for non-managers');
});

// ---------- Web Logs ----------

test('saves return descriptions of what changed, using current names', async () => {
    const result = await handle(makeClient(), 'saveLevelSettings', {
        guildId: GUILD_ID,
        userId: MANAGER,
        settings: { enabled: true, channelId: TEXT },
    });
    assert.deepEqual(result.changes, ['Levels: off → on', 'Level-up channel: none → #general']);
});

test('the access check only passes for members with Manage Server', async () => {
    const client = makeClient();
    assert.deepEqual(await handle(client, 'access', { guildId: GUILD_ID, userId: MANAGER }), { ok: true, data: true });
    assert.equal((await handle(client, 'access', { guildId: GUILD_ID, userId: MEMBER })).status, 403);
});

// ---------- Bot settings ----------

const AVATAR =
    'data:image/png;base64,' + Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]).toString('base64');

test('a bot with a banner can still be shown (image sizes must be ones Discord serves)', async () => {
    const client = makeClient({ me: { avatar: 'hash', banner: 'hash' } });
    const result = await handle(client, 'guildOverview', { guildId: GUILD_ID, userId: MANAGER });
    assert.equal(result.data.bot.banner, 'https://cdn.discordapp.com/guilds/banner.png');
});

test('the overview includes the bot profile in the server', async () => {
    botSettings = { guildId: GUILD_ID, bio: 'Hi!', embedColour: '#ff00aa' };
    const result = await handle(makeClient(), 'guildOverview', { guildId: GUILD_ID, userId: MANAGER });
    assert.deepEqual(result.data.bot, {
        username: 'Ovx',
        nickname: null,
        avatar: 'https://cdn.discordapp.com/avatars/1/default.png',
        customAvatar: null,
        defaultAvatar: 'https://cdn.discordapp.com/avatars/1/default.png',
        banner: null,
        bio: 'Hi!',
        embedColour: '#ff00aa',
        canChangeNickname: true,
    });
    assert.equal(result.data.limits.NICKNAME_MAX, 32);
    assert.equal(result.data.limits.BIO_MAX, 190);
});

test('profile changes go to Discord in one request, with who made them as the audit log reason', async () => {
    const calls = [];
    const client = makeClient({ editMe: async (options) => (calls.push(options), fakeMe(options)) });

    const result = await handle(client, 'saveBotSettings', {
        guildId: GUILD_ID,
        userId: MANAGER,
        settings: { nickname: '  Mushy  ', avatar: AVATAR, bio: 'Hello' },
    });

    assert.equal(result.ok, true);
    assert.deepEqual(calls, [
        { nick: 'Mushy', avatar: AVATAR, bio: 'Hello', reason: `Changed on the Ovx dashboard by manager (${MANAGER})` },
    ]);
    assert.equal(result.data.nickname, 'Mushy');
    assert.equal(result.data.customAvatar, 'https://cdn.discordapp.com/guilds/avatar.png');
    assert.deepEqual(result.changes, ['Nickname: Ovx (default) → Mushy', 'Avatar added', 'About Me changed']);
    assert.deepEqual(storedSettings, [{ bio: 'Hello' }], 'About Me is stored, since Discord does not return it');
});

test('only what changed is sent to Discord, and colour-only changes never call it', async () => {
    let calls = 0;
    const client = makeClient({ editMe: async (options) => (calls++, fakeMe(options)) });
    const save = (settings) => handle(client, 'saveBotSettings', { guildId: GUILD_ID, userId: MANAGER, settings });

    const same = await save({ nickname: '', avatar: null, banner: null, bio: null });
    assert.deepEqual(same.changes, []);
    assert.equal(calls, 0, 'nothing to remove and the nickname is already the default');

    const colour = await save({ embedColour: '#A78BFA' });
    assert.equal(calls, 0);
    assert.deepEqual(colour.changes, ['Embed colour: default → #a78bfa']);
    assert.deepEqual(storedSettings, [{ embedColour: '#a78bfa' }]);
});

test('bot settings need Manage Server, valid input and the Change Nickname permission for nicknames', async () => {
    const save = (client, userId, settings) =>
        handle(client, 'saveBotSettings', { guildId: GUILD_ID, userId, settings });

    assert.equal((await save(makeClient(), MEMBER, { nickname: 'x' })).status, 403);
    assert.equal((await save(makeClient(), MANAGER, { nickname: 'x'.repeat(33) })).status, 400);
    assert.equal((await save(makeClient(), MANAGER, { avatar: 'https://example.com/a.png' })).status, 400);
    assert.equal((await save(makeClient(), MANAGER, { status: 'x' })).status, 400);

    const noPermission = await save(makeClient({ canChangeNickname: false }), MANAGER, { nickname: 'x' });
    assert.equal(noPermission.status, 400);
    assert.match(noPermission.error, /Change Nickname/);

    // Other profile changes don't need it
    const avatarOnly = await save(makeClient({ canChangeNickname: false }), MANAGER, { avatar: AVATAR });
    assert.equal(avatarOnly.ok, true);
});

test('when Discord refuses a change, its reason is shown with the field it applies to', async () => {
    const rejection = (errors) =>
        new DiscordAPIError(
            { code: RESTJSONErrorCodes.InvalidFormBodyOrContentType, message: 'Invalid Form Body', errors },
            RESTJSONErrorCodes.InvalidFormBodyOrContentType,
            400,
            'PATCH',
            '/guilds/x/members/@me',
            { body: {} }
        );
    const save = (error, settings) =>
        handle(makeClient({ editMe: async () => Promise.reject(error) }), 'saveBotSettings', {
            guildId: GUILD_ID,
            userId: MANAGER,
            settings,
        });

    const tooFast = await save(
        rejection({
            avatar: { _errors: [{ code: 'AVATAR_RATE_LIMIT', message: 'You are changing your avatar too fast.' }] },
        }),
        { avatar: AVATAR }
    );
    assert.equal(tooFast.status, 400);
    assert.equal(tooFast.error, 'Avatar: You are changing your avatar too fast.');

    const unknown = await save(rejection({}), { nickname: 'clyde' });
    assert.match(unknown.error, /did not accept/);
});

// ---------- Reset ----------

test('resetting levels puts every level setting back to its default', async () => {
    config = { ...config, enabled: true, maxLevel: 50, rewards: [{ level: 5, roleId: ROLE }] };
    const result = await handle(makeClient(), 'resetSettings', {
        guildId: GUILD_ID,
        userId: MANAGER,
        section: 'levels',
    });

    assert.equal(result.ok, true);
    assert.equal(saved.length, 1);
    assert.equal(saved[0].updates.enabled, false);
    assert.equal(saved[0].updates.maxLevel, 100);
    assert.deepEqual(saved[0].updates.rewards, []);
    assert.equal('guildId' in saved[0].updates, false);
    assert.ok(result.changes.includes('Levels: on → off'));
    assert.ok(result.changes.includes('Max level: 50 → 100'));
});

test('resetting logging turns every log type off and clears the ignored channels', async () => {
    const writes = [];
    Logs_Cache.get = async () => ({
        guildId: GUILD_ID,
        message: { enabled: true, channelId: TEXT },
        ignoredChannels: [TEXT],
    });
    Logs_Cache.set = async (guildId, updates) => (writes.push(updates), { guildId, ...updates });

    const result = await handle(makeClient(), 'resetSettings', {
        guildId: GUILD_ID,
        userId: MANAGER,
        section: 'logging',
    });

    assert.equal(result.ok, true);
    assert.deepEqual(writes[0].message, { enabled: false, channelId: null });
    assert.deepEqual(writes[0].join, { enabled: false, channelId: null }, 'join/leave stop following member logs too');
    assert.deepEqual(writes[0].ignoredChannels, []);
    assert.ok(result.changes.includes('Message logs: on → off'));
});

test('resetting the bot removes its profile changes and colour', async () => {
    botSettings = { guildId: GUILD_ID, bio: 'Hi!', embedColour: '#ff00aa' };
    const calls = [];
    const client = makeClient({
        me: { nickname: 'Mushy', avatar: 'hash' },
        editMe: async (options) => (calls.push(options), fakeMe(options)),
    });

    const result = await handle(client, 'resetSettings', { guildId: GUILD_ID, userId: MANAGER, section: 'bot' });

    assert.equal(result.ok, true);
    assert.deepEqual(calls[0], {
        nick: null,
        avatar: null,
        bio: null,
        reason: `Changed on the Ovx dashboard by manager (${MANAGER})`,
    });
    assert.deepEqual(storedSettings, [{ embedColour: null, bio: null }]);
});

test('reset needs Manage Server and a known section', async () => {
    const reset = (userId, section) => handle(makeClient(), 'resetSettings', { guildId: GUILD_ID, userId, section });
    assert.equal((await reset(MEMBER, 'levels')).status, 403);
    assert.equal((await reset(MANAGER, 'everything')).status, 400);
    assert.equal((await reset(MANAGER, '__proto__')).status, 400);
    assert.equal(saved.length, 0);
});

test('a bug in an action comes back as an error result instead of looking like the shard is down', async () => {
    Guild_Level_Cache.get = async () => {
        throw new RangeError('Invalid size provided: 600');
    };
    const result = await handle(makeClient(), 'guildOverview', { guildId: GUILD_ID, userId: MANAGER });

    assert.equal(result.ok, false);
    assert.equal(result.status, 500);
    assert.match(result.error, /Something went wrong/);
    assert.doesNotMatch(result.error, /Invalid size/, 'internal details stay in the console');
});
