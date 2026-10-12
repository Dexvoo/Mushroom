import './helpers/setupEnv.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { PermissionFlagsBits } from 'discord.js';
import {
    checkTarget,
    parseDuration,
    formatDuration,
    auditReason,
    MAX_MUTE_MS,
} from '../src/features/moderation/utils/checks.js';
import { messagesToPurge } from '../src/features/moderation/subcommands/purge.js';
import { autocomplete } from '../src/features/moderation/commands/moderation.js';
import Guild_Settings_Cache from '../src/shared/cache/guildSettings.cache.js';

const OWNER = '100000000000000001';
const MOD = '100000000000000002';
const TARGET = '100000000000000003';
const BOT = '100000000000000004';

const person = (id, position, { admin = false } = {}) => ({
    id,
    roles: { highest: { position } },
    permissions: { has: (flag) => admin && flag === PermissionFlagsBits.Administrator },
});

// ---------- Who can be acted on ----------

test('moderators can only act on people below them, and Ovx only on people below it', () => {
    const people = (targetPosition, extra = {}) => ({
        moderator: person(MOD, 5),
        target: person(TARGET, targetPosition, extra),
        me: person(BOT, 8),
        ownerId: OWNER,
    });

    assert.equal(checkTarget('ban', people(4)), null);
    assert.equal(checkTarget('ban', people(5)), 'target_higher_than_you', 'equal roles are not enough');
    assert.equal(
        checkTarget('kick', { ...people(6), moderator: person(OWNER, 1) }),
        null,
        'the owner outranks everyone'
    );
    assert.equal(checkTarget('kick', { ...people(9), moderator: person(OWNER, 1) }), 'target_higher_than_bot');
    assert.equal(checkTarget('mute', people(1, { admin: true })), 'target_admin');
    assert.equal(checkTarget('ban', { ...people(1), target: person(OWNER, 1) }), 'target_owner');
});

test('nobody punishes themselves or Ovx, but changing your own nickname is fine', () => {
    const me = person(BOT, 8);
    const moderator = person(MOD, 5);
    assert.equal(checkTarget('ban', { moderator, target: moderator, me, ownerId: OWNER }), 'target_self');
    assert.equal(checkTarget('nickname', { moderator, target: moderator, me, ownerId: OWNER }), null);
    assert.equal(checkTarget('kick', { moderator, target: me, me, ownerId: OWNER }), 'target_bot_self');
    assert.equal(checkTarget('nickname', { moderator, target: me, me, ownerId: OWNER }), 'use_dashboard_nickname');
});

// ---------- Durations ----------

test('mute lengths are read the way people type them', () => {
    assert.equal(parseDuration('10m'), 600_000);
    assert.equal(parseDuration('1h 30m'), 5_400_000);
    assert.equal(parseDuration('1h30m'), 5_400_000);
    assert.equal(parseDuration('2 days'), 172_800_000);
    assert.equal(parseDuration('1 hour and 5 minutes'), 3_900_000);
    assert.equal(parseDuration('15'), 900_000, 'a plain number is minutes');
    assert.equal(parseDuration('4w'), MAX_MUTE_MS);
    for (const nonsense of ['', 'soon', '5 potatoes', '1h lol', '-5m']) {
        assert.equal(parseDuration(nonsense), null, nonsense);
    }
});

test('durations are shown with their two largest units', () => {
    assert.equal(formatDuration(5_400_000), '1 hour 30 minutes');
    assert.equal(formatDuration(86_400_000 + 3_600_000 + 60_000), '1 day 1 hour');
    assert.equal(formatDuration(60_000), '1 minute');
});

test('the audit log names the moderator, since Discord would only show Ovx', () => {
    assert.equal(auditReason({ username: 'dexvo' }, 'spam'), 'By @dexvo: spam');
    assert.equal(auditReason({ username: 'dexvo' }, null), 'By @dexvo: No reason given');
    assert.ok(auditReason({ username: 'x' }, 'y'.repeat(600)).length <= 512);
});

test('mute length suggestions explain what was typed', async () => {
    let choices;
    const interaction = (typed) => ({
        options: { getFocused: () => typed },
        respond: async (list) => (choices = list),
    });

    await autocomplete(interaction('1h30m'));
    assert.deepEqual(choices[0], { name: '1 hour 30 minutes', value: '1h30m' });

    await autocomplete(interaction(''));
    assert.deepEqual(
        choices.map((choice) => choice.name),
        ['1 minute', '5 minutes', '10 minutes', '1 hour', '6 hours', '1 day', '1 week']
    );

    await autocomplete(interaction('60d'));
    assert.ok(!choices.some((choice) => choice.value === '60d'), 'longer than Discord allows');
});

// ---------- Purge ----------

test('purge skips pinned messages, other people when filtered, and messages too old to bulk-delete', () => {
    const now = Date.now();
    const message = (id, authorId, ageDays, pinned = false) => ({
        id,
        pinned,
        author: { id: authorId },
        createdTimestamp: now - ageDays * 86_400_000,
    });
    const messages = [
        message('1', TARGET, 0),
        message('2', MOD, 0),
        message('3', TARGET, 0, true),
        message('4', TARGET, 1),
        message('5', TARGET, 15),
    ];

    assert.deepEqual(
        messagesToPurge(messages, { amount: 10, now }).map((m) => m.id),
        ['1', '2', '4']
    );
    assert.deepEqual(
        messagesToPurge(messages, { amount: 10, userId: TARGET, now }).map((m) => m.id),
        ['1', '4']
    );
    assert.deepEqual(
        messagesToPurge(messages, { amount: 1, now }).map((m) => m.id),
        ['1']
    );
});

// ---------- Commands ----------

let replies;
let bans;
let actions;

/**
 * A fake slash command interaction for /moderation.
 * @param {{ options?: Record<string, any>, member?: any, targetInGuild?: boolean, missing?: string[] }} [setup]
 */
function fakeInteraction({ options = {}, targetInGuild = true, missing = [] } = {}) {
    const targetUser = { id: TARGET, username: 'target', toString: () => `<@${TARGET}>`, send: async () => {} };
    const target = {
        ...person(TARGET, 1),
        user: targetUser,
        communicationDisabledUntilTimestamp: null,
        toString: () => `<@${TARGET}>`,
        kick: async (reason) => actions.push(['kick', reason]),
        timeout: async (ms, reason) => actions.push(['timeout', ms, reason]),
    };
    const guild = {
        id: '400000000000000001',
        name: 'Test',
        ownerId: OWNER,
        preferredLocale: 'en-GB',
        members: {
            me: person(BOT, 8),
            fetch: async (id) =>
                targetInGuild && id === TARGET ? target : Promise.reject(new Error('Unknown Member')),
        },
        bans: {
            fetch: async (id) => (bans.has(id) ? { user: { id } } : Promise.reject(new Error('Unknown Ban'))),
            create: async (id, details) => (bans.set(id, details), actions.push(['ban', id, details])),
            remove: async (id, reason) => (bans.delete(id), actions.push(['unban', id, reason])),
        },
    };
    const interaction = {
        guild,
        guildId: guild.id,
        locale: 'en-GB',
        user: { id: MOD, username: 'mod' },
        member: person(MOD, 5),
        deferred: false,
        replied: false,
        async deferReply() {
            interaction.deferred = true;
        },
        options: {
            getUser: (name) => (name === 'user' ? targetUser : null),
            getMember: (name) => (name === 'user' && targetInGuild ? target : null),
            getString: (name) => options[name] ?? null,
            getInteger: (name) => options[name] ?? null,
        },
        client: {
            utils: {
                Translate: (key, locale, args = {}) =>
                    `${key}${Object.keys(args).length ? ` ${JSON.stringify(args)}` : ''}`,
                PermissionCheck: (_, perms, who) =>
                    who === guild.members.me && missing.length ? [false, [missing]] : [true],
                Embed: async (_, colour, title, description) => replies.push({ colour, title, description }),
            },
        },
    };
    interaction.member.user = interaction.user;
    return interaction;
}

beforeEach(() => {
    replies = [];
    bans = new Map();
    actions = [];
    Guild_Settings_Cache.get = async () => ({ embedColour: null });
});

test('ban: records the moderator in the audit log and can delete recent messages', async () => {
    const { execute } = await import('../src/features/moderation/subcommands/ban.js');
    await execute(fakeInteraction({ options: { reason: 'spam', 'delete-messages': 3600 } }));

    assert.deepEqual(actions, [['ban', TARGET, { reason: 'By @mod: spam', deleteMessageSeconds: 3600 }]]);
    assert.match(replies[0].description, /commands\.moderation\.banned/);
});

test('ban: works by ID for someone who already left, and not twice', async () => {
    const { execute } = await import('../src/features/moderation/subcommands/ban.js');
    await execute(fakeInteraction({ targetInGuild: false }));
    assert.equal(actions[0][0], 'ban');
    assert.doesNotMatch(replies[0].description, /dm_failed/, 'nobody to message, so no warning');

    await execute(fakeInteraction({ targetInGuild: false }));
    assert.match(replies[1].description, /already_banned/);
    assert.equal(actions.length, 1);
});

test('nothing happens when Ovx is missing the permission, and it says which', async () => {
    const { execute } = await import('../src/features/moderation/subcommands/kick.js');
    await execute(fakeInteraction({ missing: ['KickMembers'] }));
    assert.equal(actions.length, 0);
    assert.match(replies[0].description, /bot_missing_perms.*Kick Members/);
});

test('mute: refuses lengths it cannot read or that Discord does not allow', async () => {
    const { execute } = await import('../src/features/moderation/subcommands/mute.js');
    await execute(fakeInteraction({ options: { duration: 'soon' } }));
    await execute(fakeInteraction({ options: { duration: '30d' } }));
    assert.match(replies[0].description, /bad_duration/);
    assert.match(replies[1].description, /duration_range/);

    await execute(fakeInteraction({ options: { duration: '10m', reason: 'calm down' } }));
    assert.deepEqual(actions, [['timeout', 600_000, 'By @mod: calm down']]);
});

test('unmute: only for someone who is muted', async () => {
    const { execute } = await import('../src/features/moderation/subcommands/unmute.js');
    await execute(fakeInteraction());
    assert.match(replies[0].description, /not_muted/);
    assert.equal(actions.length, 0);
});

test('a moderation command never reaches Discord for someone above the moderator', async () => {
    const { execute } = await import('../src/features/moderation/subcommands/kick.js');
    const interaction = fakeInteraction();
    interaction.member.roles.highest.position = 0;
    await execute(interaction);
    assert.equal(actions.length, 0);
    assert.match(replies[0].description, /target_higher_than_you/);
});

test('/moderation has its actions', async () => {
    const { commandData } = await import('../src/features/moderation/commands/moderation.js');
    assert.deepEqual(
        commandData.toJSON().options.map((option) => option.name),
        ['ban', 'unban', 'kick', 'mute', 'unmute', 'purge', 'nickname', 'warn', 'unwarn', 'history']
    );
});
