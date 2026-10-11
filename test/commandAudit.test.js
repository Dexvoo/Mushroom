import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withCommandAudit, commandName } from '../src/dashboard/commandAudit.js';
import { describeLevelChanges, describeLoggingChanges } from '../src/dashboard/describeChanges.js';
import { levelsView, loggingView, nameLookup } from '../src/dashboard/settingsViews.js';
import { createMongoAuditStore } from '../src/dashboard/auditStore.js';
import { AuditLog } from '../src/dashboard/models/auditLog.js';

const guild = {
    channels: { cache: new Map([['c1', { name: 'mod-logs' }]]) },
    roles: { cache: new Map([['r1', { name: 'Legend' }]]) },
};

function fakeInteraction({ group = 'settings', subcommand = 'max-level' } = {}) {
    return {
        commandName: 'level',
        guildId: 'g1',
        guild,
        user: {
            id: '123',
            username: 'dexvo',
            displayName: 'Dexvo Global',
            displayAvatarURL: () => 'https://cdn.discordapp.com/avatars/123/abc.png?size=64',
        },
        member: { displayName: 'Dexvo' },
        options: {
            getSubcommandGroup: () => group,
            getSubcommand: () => subcommand,
        },
    };
}

function memoryStore() {
    const entries = [];
    return {
        entries,
        record: async (entry) => void entries.push(entry),
        list: async () => ({ entries, nextCursor: null }),
    };
}

const levelOptions = (settings, store) => ({
    action: 'Updated level settings',
    snapshot: async () => levelsView(settings.current),
    describe: (before, after, g) => describeLevelChanges(before, after, nameLookup(g)),
    store,
});

const baseLevels = { enabled: true, maxLevel: 100, messageCooldown: 60, rewards: [], blacklisted: {} };

test('a command that changes settings is recorded with who ran it and which command', async () => {
    const settings = { current: { ...baseLevels } };
    const store = memoryStore();

    await withCommandAudit(fakeInteraction(), levelOptions(settings, store), async () => {
        settings.current = { ...settings.current, maxLevel: 50 };
    });

    assert.deepEqual(store.entries, [
        {
            guildId: 'g1',
            user: {
                id: '123',
                username: 'dexvo',
                displayName: 'Dexvo',
                avatar: 'https://cdn.discordapp.com/avatars/123/abc.png?size=64',
            },
            action: 'Updated level settings',
            changes: ['Max level: 100 → 50'],
            source: '/level settings max-level',
        },
    ]);
});

test('commands that change nothing (or stop with an error message) are not recorded', async () => {
    const settings = { current: { ...baseLevels } };
    const store = memoryStore();
    await withCommandAudit(fakeInteraction(), levelOptions(settings, store), async () => {});
    assert.equal(store.entries.length, 0);
});

test('changes made by mutating the settings in place are still noticed', async () => {
    // e.g. /level settings blacklist pushes into the existing array before saving
    const settings = { current: { ...baseLevels, blacklisted: { roleIds: [], channelIds: [] } } };
    const store = memoryStore();

    await withCommandAudit(fakeInteraction({ subcommand: 'blacklist' }), levelOptions(settings, store), async () => {
        settings.current.blacklisted.roleIds.push('r1');
    });

    assert.deepEqual(store.entries[0].changes, ['Added no-xp role: @Legend']);
});

test('join logs set up on their own are recorded', async () => {
    let config = { guildId: 'g1' };
    const store = memoryStore();
    const interaction = { ...fakeInteraction({ group: null, subcommand: 'setup' }), commandName: 'logs' };

    await withCommandAudit(
        interaction,
        {
            action: 'Updated logging settings',
            snapshot: async () => loggingView(config),
            describe: (before, after, g) => describeLoggingChanges(before, after, nameLookup(g)),
            store,
        },
        async () => {
            config = { ...config, join: { enabled: true, channelId: 'c1' } };
        }
    );

    assert.equal(store.entries[0].source, '/logs setup');
    assert.deepEqual(store.entries[0].changes, ['Join logs: off → on', 'Join logs channel: none → #mod-logs']);
});

test('errors from the command still reach the command handler, and nothing is recorded', async () => {
    const settings = { current: { ...baseLevels } };
    const store = memoryStore();

    await assert.rejects(
        withCommandAudit(fakeInteraction(), levelOptions(settings, store), async () => {
            throw new Error('database down');
        }),
        /database down/
    );
    assert.equal(store.entries.length, 0);
});

test('a Web Logs failure never fails the command', async () => {
    const settings = { current: { ...baseLevels } };
    const store = { ...memoryStore(), record: async () => Promise.reject(new Error('write failed')) };
    let ran = false;

    await withCommandAudit(fakeInteraction(), levelOptions(settings, store), async () => {
        ran = true;
        settings.current = { ...settings.current, maxLevel: 10 };
    });
    assert.ok(ran);
});

test('if the settings cannot be read first, the command still runs', async () => {
    const store = memoryStore();
    let ran = false;
    await withCommandAudit(
        fakeInteraction(),
        {
            action: 'Updated level settings',
            snapshot: async () => Promise.reject(new Error('cache down')),
            describe: () => ['never'],
            store,
        },
        async () => void (ran = true)
    );
    assert.ok(ran);
    assert.equal(store.entries.length, 0);
});

test('command names include the group and subcommand when there are any', () => {
    assert.equal(commandName(fakeInteraction()), '/level settings max-level');
    assert.equal(
        commandName({ ...fakeInteraction({ group: null, subcommand: 'ignore' }), commandName: 'logs' }),
        '/logs ignore'
    );
});

test('entries saved before sources existed show as Dashboard', async () => {
    AuditLog.find = () => {
        const chain = {
            sort: () => chain,
            limit: () => chain,
            lean: async () => [
                {
                    _id: '0'.repeat(24),
                    createdAt: new Date(),
                    username: 'a',
                    displayName: 'a',
                    action: 'x',
                    changes: [],
                },
            ],
        };
        return chain;
    };
    const { entries } = await createMongoAuditStore().list('g1', {});
    assert.equal(entries[0].source, 'Dashboard');
});
