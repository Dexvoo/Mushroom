import { createHash, timingSafeEqual } from 'node:crypto';
import { recordVote } from './votes.js';
import { LogData } from '../../../shared/utils/logger.js';

const SNOWFLAKE = /^\d{17,20}$/;

/** @param {string} value */
const digest = (value) => createHash('sha256').update(value).digest();

/**
 * Whether the Authorization header is the secret. Compared as hashes in constant time, so neither the
 * secret nor its length can be worked out from how long the check takes.
 * @param {unknown} header
 * @param {string} secret
 */
export function isAuthorized(header, secret) {
    if (typeof header !== 'string' || !secret) return false;
    return timingSafeEqual(digest(header), digest(secret));
}

/**
 * Express handler for Top.gg's vote webhook (POST, JSON: { bot, user, type: 'upvote' | 'test', isWeekend }).
 * Top.gg retries anything that isn't a 2xx, so a vote that was recorded always gets a 200.
 *
 * @param {{
 *   secret: string,
 *   applicationId: string,
 *   logVote?: (userId: string, votes: number) => Promise<unknown>,
 *   record?: (userId: string) => Promise<number>,
 * }} options
 * @returns {import('express').RequestHandler}
 */
export function createTopggWebhook({ secret, applicationId, logVote, record = recordVote }) {
    return async (req, res) => {
        if (!isAuthorized(req.get('authorization'), secret)) return res.status(401).json({ error: 'Unauthorized' });

        const { user, bot, type } = req.body ?? {};
        if (typeof user !== 'string' || !SNOWFLAKE.test(user)) return res.status(400).json({ error: 'Invalid user' });
        if (bot !== undefined && bot !== applicationId) return res.status(400).json({ error: 'Wrong bot' });

        // The "Test" button on Top.gg: shows the webhook works, without counting as a vote
        if (type === 'test') {
            LogData('Top.gg', `Test vote received for ${user}`, 'info');
            return res.status(200).json({ ok: true });
        }

        let votes;
        try {
            votes = await record(user);
        } catch (error) {
            LogData('Top.gg', `Could not record a vote from ${user}: ${error.message}`, 'error');
            return res.status(500).json({ error: 'Could not record the vote' }); // Top.gg will retry
        }

        LogData('Top.gg', `Vote from ${user} (${votes} in total)`, 'info');
        logVote?.(user, votes).catch(() => {}); // The developer log is a nice-to-have
        res.status(200).json({ ok: true });
    };
}
