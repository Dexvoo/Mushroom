import './helpers/setupEnv.js';
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDashboardApp } from '../src/dashboard/server.js';
import { isAuthorized } from '../src/features/votes/utils/webhook.js';
import { UserVote } from '../src/features/votes/models/userVote.js';

const SECRET = 'a-long-random-top-gg-secret';
const APPLICATION_ID = '100000000000000000';
const VOTER = '300000000000000001';

let server;
let base;
let recorded;
let logged;
let failRecording;

const bridge = {
    async guild() {
        return { ok: true, data: {} };
    },
    async botGuildIds() {
        return new Set();
    },
    async stats() {
        return [];
    },
    async logVote(userId, votes) {
        logged.push({ userId, votes });
    },
};

before(async () => {
    const app = createDashboardApp({
        bridge,
        env: /** @type {any} */ ({
            APPLICATION_ID,
            DEVELOPER_IDS: [],
            TOPGG_WEBHOOK_SECRET: SECRET,
            DASHBOARD: {
                PORT: 0,
                HOST: '127.0.0.1',
                URL: 'http://localhost:3000',
                SECURE: false,
                TRUST_PROXY: false,
                CLIENT_SECRET: 'client-secret',
                SESSION_SECRET: 'test-session-secret-that-is-long-enough',
            },
        }),
        auditStore: /** @type {any} */ ({ record: async () => {}, list: async () => ({ entries: [] }) }),
        caseStore: /** @type {any} */ ({ list: async () => ({ cases: [] }), remove: async () => null }),
    });
    await new Promise((resolve) => {
        server = app.listen(0, '127.0.0.1', resolve);
    });
    base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

beforeEach(() => {
    recorded = [];
    logged = [];
    failRecording = false;
    UserVote.findOneAndUpdate = /** @type {any} */ (
        (filter) => ({
            lean: async () => {
                if (failRecording) throw new Error('database down');
                recorded.push(filter.userId);
                return { userId: filter.userId, votes: recorded.length };
            },
        })
    );
});

/** Top.gg's servers post straight to the webhook: no Origin header, no session. */
const vote = (body, authorization = SECRET) =>
    fetch(`${base}/webhooks/topgg`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authorization ? { Authorization: authorization } : {}) },
        body: JSON.stringify(body),
    });

test('the secret is compared exactly', () => {
    assert.equal(isAuthorized(SECRET, SECRET), true);
    assert.equal(isAuthorized(`${SECRET} `, SECRET), false);
    assert.equal(isAuthorized('', SECRET), false);
    assert.equal(isAuthorized(undefined, SECRET), false);
    assert.equal(isAuthorized(SECRET, ''), false);
});

test('a vote from Top.gg is recorded and logged', async () => {
    const response = await vote({ bot: APPLICATION_ID, user: VOTER, type: 'upvote' });
    assert.equal(response.status, 200);
    assert.deepEqual(recorded, [VOTER]);
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(logged, [{ userId: VOTER, votes: 1 }]);
});

test('requests without the right secret are refused and nothing is recorded', async () => {
    assert.equal((await vote({ user: VOTER, type: 'upvote' }, 'wrong')).status, 401);
    assert.equal((await vote({ user: VOTER, type: 'upvote' }, null)).status, 401);
    assert.deepEqual(recorded, []);
});

test("Top.gg's test button checks the webhook without counting a vote", async () => {
    const response = await vote({ bot: APPLICATION_ID, user: VOTER, type: 'test' });
    assert.equal(response.status, 200);
    assert.deepEqual(recorded, []);
});

test('votes for another bot, or without a valid user, are refused', async () => {
    assert.equal((await vote({ bot: '999999999999999999', user: VOTER, type: 'upvote' })).status, 400);
    assert.equal((await vote({ bot: APPLICATION_ID, user: 'someone', type: 'upvote' })).status, 400);
    assert.deepEqual(recorded, []);
});

test('if the vote cannot be saved, Top.gg is told to retry', async () => {
    failRecording = true;
    assert.equal((await vote({ bot: APPLICATION_ID, user: VOTER, type: 'upvote' })).status, 500);
});
