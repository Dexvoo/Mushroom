/**
 * Human-readable descriptions of what a dashboard save changed, for the Web Logs.
 * Pure (names are looked up through the functions passed in) so it can be unit-tested.
 *
 * @typedef {{ channel: (id: string | null) => string, role: (id: string) => string }} NameLookup
 */

const onOff = (value) => (value ? 'on' : 'off');

/**
 * @param {any} before - levelsView before the save
 * @param {any} after - levelsView after the save
 * @param {NameLookup} names
 * @returns {string[]}
 */
export function describeLevelChanges(before, after, names) {
    const changes = [];
    const changed = (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]);

    if (changed('enabled')) changes.push(`Levels: ${onOff(before.enabled)} → ${onOff(after.enabled)}`);
    if (changed('channelId')) {
        changes.push(`Level-up channel: ${names.channel(before.channelId)} → ${names.channel(after.channelId)}`);
    }
    if (changed('levelUpMessage')) {
        changes.push(after.levelUpMessage ? 'Level-up message changed' : 'Level-up message reset to the default');
    }
    if (changed('messageCooldown')) {
        changes.push(`Message cooldown: ${before.messageCooldown}s → ${after.messageCooldown}s`);
    }
    if (changed('maxLevel')) changes.push(`Max level: ${before.maxLevel} → ${after.maxLevel}`);
    if (changed('removePastRewards')) {
        changes.push(`Remove past rewards: ${onOff(before.removePastRewards)} → ${onOff(after.removePastRewards)}`);
    }
    if (changed('publicLeaderboard')) {
        changes.push(`Public leaderboard: ${onOff(before.publicLeaderboard)} → ${onOff(after.publicLeaderboard)}`);
    }

    // Rewards are compared as "level + role" pairs
    const rewardKey = (reward) => `${reward.level}:${reward.roleId}`;
    const beforeRewards = new Set((before.rewards ?? []).map(rewardKey));
    const afterRewards = new Set((after.rewards ?? []).map(rewardKey));
    for (const reward of after.rewards ?? []) {
        if (!beforeRewards.has(rewardKey(reward))) {
            changes.push(`Added reward: level ${reward.level} → ${names.role(reward.roleId)}`);
        }
    }
    for (const reward of before.rewards ?? []) {
        if (!afterRewards.has(rewardKey(reward))) {
            changes.push(`Removed reward: level ${reward.level} → ${names.role(reward.roleId)}`);
        }
    }

    changes.push(
        ...listChanges('No-XP role', before.blacklisted?.roleIds, after.blacklisted?.roleIds, names.role),
        ...listChanges('No-XP channel', before.blacklisted?.channelIds, after.blacklisted?.channelIds, names.channel)
    );

    return changes;
}

/**
 * @param {any} before - loggingView before the save
 * @param {any} after - loggingView after the save
 * @param {NameLookup} names
 * @returns {string[]}
 */
export function describeLoggingChanges(before, after, names) {
    const changes = [];

    for (const [type, now] of Object.entries(after.types ?? {})) {
        const was = before.types?.[type] ?? { enabled: false, channelId: null };
        const label = `${type.charAt(0).toUpperCase()}${type.slice(1)} logs`;
        if (was.enabled !== now.enabled) changes.push(`${label}: ${onOff(was.enabled)} → ${onOff(now.enabled)}`);
        if (was.channelId !== now.channelId) {
            changes.push(`${label} channel: ${names.channel(was.channelId)} → ${names.channel(now.channelId)}`);
        }
    }

    changes.push(...listChanges('Ignored channel', before.ignoredChannels, after.ignoredChannels, names.channel));
    return changes;
}

/**
 * "Added X" / "Removed X" lines for a list of IDs.
 * @param {string} label
 * @param {string[] | undefined} before
 * @param {string[] | undefined} after
 * @param {(id: string) => string} name
 */
function listChanges(label, before = [], after = [], name) {
    return [
        ...after.filter((id) => !before.includes(id)).map((id) => `Added ${label.toLowerCase()}: ${name(id)}`),
        ...before.filter((id) => !after.includes(id)).map((id) => `Removed ${label.toLowerCase()}: ${name(id)}`),
    ];
}

/**
 * @typedef {Object} BotViewForChanges
 * @property {string} username
 * @property {string | null} nickname
 * @property {string | null} customAvatar - The server avatar, if one is set
 * @property {string | null} banner
 * @property {string | null} bio
 * @property {string | null} embedColour
 */

/**
 * @param {BotViewForChanges} before - botView before the save
 * @param {BotViewForChanges} after - botView after the save
 * @returns {string[]}
 */
export function describeBotChanges(before, after) {
    const changes = [];

    if (before.nickname !== after.nickname) {
        changes.push(
            after.nickname
                ? `Nickname: ${before.nickname ?? `${before.username} (default)`} → ${after.nickname}`
                : `Nickname reset: ${before.nickname} → ${after.username}`
        );
    }
    if (before.customAvatar !== after.customAvatar)
        changes.push(`Avatar ${imageChange(before.customAvatar, after.customAvatar)}`);
    if (before.banner !== after.banner) changes.push(`Banner ${imageChange(before.banner, after.banner)}`);
    if (before.bio !== after.bio) changes.push(after.bio ? 'About Me changed' : 'About Me removed');
    if (before.embedColour !== after.embedColour) {
        changes.push(`Embed colour: ${before.embedColour ?? 'default'} → ${after.embedColour ?? 'default'}`);
    }

    return changes;
}

const imageChange = (before, after) => (!before ? 'added' : !after ? 'removed (back to the default)' : 'changed');

/**
 * @param {{ enabled: boolean, humanRoleIds: string[], botRoleIds: string[] }} before - autoRolesView before the save
 * @param {{ enabled: boolean, humanRoleIds: string[], botRoleIds: string[] }} after - autoRolesView after the save
 * @param {NameLookup} names
 * @returns {string[]}
 */
export function describeAutoRoleChanges(before, after, names) {
    return [
        ...(before.enabled !== after.enabled ? [`Auto roles: ${onOff(before.enabled)} → ${onOff(after.enabled)}`] : []),
        ...listChanges('Role for new members', before.humanRoleIds, after.humanRoleIds, names.role),
        ...listChanges('Role for new bots', before.botRoleIds, after.botRoleIds, names.role),
    ];
}

/**
 * @param {any} before - welcomeView before the save
 * @param {any} after - welcomeView after the save
 * @param {NameLookup} names
 * @returns {string[]}
 */
export function describeWelcomeChanges(before, after, names) {
    const changes = [];
    for (const [kind, label] of [
        ['welcome', 'Welcome'],
        ['goodbye', 'Goodbye'],
    ]) {
        const was = before[kind];
        const now = after[kind];
        if (was.enabled !== now.enabled)
            changes.push(`${label} messages: ${onOff(was.enabled)} → ${onOff(now.enabled)}`);
        if (was.channelId !== now.channelId) {
            changes.push(`${label} channel: ${names.channel(was.channelId)} → ${names.channel(now.channelId)}`);
        }
        if (was.message !== now.message) {
            changes.push(now.message ? `${label} message changed` : `${label} message reset to the default`);
        }
        if (was.embed !== now.embed) changes.push(`${label} embed: ${onOff(was.embed)} → ${onOff(now.embed)}`);
        if (was.title !== now.title)
            changes.push(now.title ? `${label} embed title changed` : `${label} embed title removed`);
    }
    return changes;
}
