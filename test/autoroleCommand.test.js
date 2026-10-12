import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Collection } from 'discord.js';
import { stubEnvironment } from './helpers/env.js';
import Auto_Roles_Cache from '../src/features/autoRoles/cache/autoRoles.cache.js';
import { AuditLog } from '../src/dashboard/models/auditLog.js';

const GUILD_ID = '400000000000000001';
/** @type {typeof import('../src/locales/en-GB.js').default} */
let en;
/** @type {(interaction: any) => Promise<any>} */
let execute;
let config;
let recorded;

before(async () => {
    // The command reaches the environment module through the Translate helper
    stubEnvironment({});
    ({ default: en } = await import('../src/locales/en-GB.js'));
    ({ execute } = await import('../src/features/autoRoles/commands/autorole.js'));
});

beforeEach(() => {
    config = { guildId: GUILD_ID, enabled: true, humanRoleIds: [], botRoleIds: [] };
    recorded = [];
    Auto_Roles_Cache.get = async () => config;
    Auto_Roles_Cache.set = async (guildId, updates) => (config = { ...config, ...updates });
    AuditLog.create = async (entry) => void recorded.push(entry);
});

/** Translations without placeholders filled, enough to tell replies apart. */
const translate = (key) => key.split('.').reduce((value, part) => value?.[part], en) ?? key;

/**
 * @param {string} subcommand
 * @param {{ type?: string, role?: any, enabled?: boolean, canManage?: boolean }} [options]
 */
function makeInteraction(subcommand, { type = 'members', role, enabled, canManage = true } = {}) {
    const replies = [];
    const roles = new Collection();
    const guild = {
        id: GUILD_ID,
        name: 'Test',
        roles: { cache: roles },
        channels: { cache: new Collection() },
        members: { me: { roles: { highest: { position: 10 } }, permissions: { has: () => true } } },
    };
    const client = {
        utils: {
            Translate: translate,
            PermissionCheck: async () => (canManage ? [true, []] : [false, ['ManageGuild']]),
            Embed: async (_target, colour, title, description, options) =>
                void replies.push({ colour, title, description, fields: options?.fields }),
        },
    };
    const makeRole = (id, name, position, managed = false) => {
        const value = { id, name, position, managed, guild, client, toString: () => `<@&${id}>` };
        roles.set(id, value);
        return value;
    };
    guild.roles.cache.set(GUILD_ID, { id: GUILD_ID, name: '@everyone', position: 0 });

    return {
        replies,
        makeRole,
        guild,
        interaction: {
            client,
            guild,
            guildId: GUILD_ID,
            locale: 'en-GB',
            commandName: 'autorole',
            member: { displayName: 'Manager' },
            user: { id: '1', username: 'manager', displayName: 'Manager', displayAvatarURL: () => 'x' },
            options: {
                getSubcommand: () => subcommand,
                getSubcommandGroup: () => null,
                getString: () => type,
                getRole: () => role,
                getBoolean: () => enabled,
            },
        },
    };
}

test('add gives a role to people who join, and the change shows in the Web Logs', async () => {
    const setup = makeInteraction('add');
    setup.interaction.options.getRole = () => setup.makeRole('500000000000000001', 'Regular', 2);

    await execute(setup.interaction);

    assert.deepEqual(config.humanRoleIds, ['500000000000000001']);
    assert.equal(setup.replies[0].colour, 'Brand');
    assert.equal(recorded.length, 1);
    assert.equal(recorded[0].source, '/autorole add');
    assert.deepEqual(recorded[0].changes, ['Added role for new members: @Regular']);
});

test('add refuses roles Ovx cannot give, duplicates and full lists', async () => {
    const tryAdd = async (makeRole, type = 'members') => {
        const setup = makeInteraction('add', { type });
        setup.interaction.options.getRole = () => makeRole(setup);
        await execute(setup.interaction);
        return setup.replies[0];
    };

    assert.equal((await tryAdd((s) => s.makeRole('5001', 'Admin', 20))).description, en.commands.autorole.too_high);
    assert.equal(
        (await tryAdd((s) => s.makeRole('5002', 'Booster', 3, true))).description,
        en.commands.autorole.managed
    );
    assert.equal(
        (await tryAdd((s) => s.makeRole(GUILD_ID, '@everyone', 0))).description,
        en.commands.autorole.everyone
    );

    config.botRoleIds = ['5003'];
    assert.equal(
        (await tryAdd((s) => s.makeRole('5003', 'Bots', 2), 'bots')).description,
        en.commands.autorole.already_bots
    );

    config.humanRoleIds = Array.from({ length: 10 }, (_, i) => `60${i}`);
    assert.equal((await tryAdd((s) => s.makeRole('5004', 'Extra', 2))).description, en.commands.autorole.list_full);

    assert.equal(recorded.length, 0, 'refused changes are not logged');
});

test('remove takes a role off the right list', async () => {
    config.botRoleIds = ['5003'];
    const setup = makeInteraction('remove', { type: 'bots' });
    setup.interaction.options.getRole = () => setup.makeRole('5003', 'Bots', 2);

    await execute(setup.interaction);
    assert.deepEqual(config.botRoleIds, []);
    assert.deepEqual(recorded[0].changes, ['Removed role for new bots: @Bots']);

    const missing = makeInteraction('remove', { type: 'members' });
    missing.interaction.options.getRole = () => missing.makeRole('5005', 'Other', 2);
    await execute(missing.interaction);
    assert.equal(missing.replies[0].description, en.commands.autorole.not_in_members);
});

test('toggle turns auto roles on and off without touching the lists', async () => {
    config.humanRoleIds = ['5001'];
    const setup = makeInteraction('toggle', { enabled: false });
    await execute(setup.interaction);

    assert.equal(config.enabled, false);
    assert.deepEqual(config.humanRoleIds, ['5001']);
    assert.deepEqual(recorded[0].changes, ['Auto roles: on → off']);
});

test('list shows both lists and marks roles that can no longer be given', async () => {
    config = { ...config, enabled: false, humanRoleIds: ['5001', '5002', 'gone'], botRoleIds: [] };
    const setup = makeInteraction('list');
    setup.makeRole('5001', 'Regular', 2);
    setup.makeRole('5002', 'Admin', 20);

    await execute(setup.interaction);
    const [reply] = setup.replies;
    assert.equal(
        reply.fields[0].value,
        `<@&5001>\n<@&5002> (${en.commands.autorole.cannot_give})\n${en.commands.autorole.deleted_role}`
    );
    assert.equal(reply.fields[1].value, en.commands.autorole.none);
    assert.match(reply.description, /currently off/);
    assert.equal(recorded.length, 0, 'viewing is not logged');
});

test('every subcommand needs Manage Server', async () => {
    for (const subcommand of ['add', 'remove', 'list', 'toggle']) {
        const setup = makeInteraction(subcommand, { canManage: false, enabled: false });
        await execute(setup.interaction);
        assert.equal(setup.replies[0].colour, 'Red', subcommand);
    }
    assert.equal(config.enabled, true);
    assert.equal(recorded.length, 0);
});
