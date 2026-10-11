import { test, before } from 'node:test';
import assert from 'node:assert/strict';

/** @type {typeof import('../src/shared/utils/i18n.js').Translate} */
let Translate;

before(async () => {
    // i18n reads the environment module, which exits if required variables are missing.
    // Fill in placeholders so the tests run without a .env file.
    const required = [
        'MONGO_URI',
        'DEVELOPER_MODE',
        'DEV_GUILD_ID',
        'BOT_TOKEN',
        'BOT_APPLICATION_ID',
        'BOT_TOKEN_DEV',
        'BOT_APPLICATION_ID_DEV',
        'DEVELOPER_IDS',
        'COMMAND_CID',
        'JOIN_GUID_CID',
        'LEAVE_GUILD_CID',
        'USER_LEVEL_CID',
        'VOTE_CID',
    ];
    for (const name of required) process.env[name] ??= 'test';
    process.env.DEFAULT_LANGUAGE = 'en-GB';

    ({ Translate } = await import('../src/shared/utils/i18n.js'));
});

test('translates a key and fills in arguments', () => {
    assert.equal(
        Translate('errors.cooldown', 'en-GB', { time: '5s', command: 'ping' }),
        'Please wait 5s before using the `ping` command again.'
    );
});

test('uses the requested locale when it has the key', () => {
    assert.match(Translate('errors.cooldown', 'de', { time: '5s', command: 'ping' }), /^Bitte warte 5s/);
});

test('falls back to the default locale for unknown locales', () => {
    assert.equal(Translate('errors.title', 'xx-XX'), Translate('errors.title', 'en-GB'));
});

test('returns the key itself when no locale has it', () => {
    assert.equal(Translate('does.not.exist', 'en-GB'), 'does.not.exist');
});

test('inserts argument values literally, even with $ patterns', () => {
    // Usernames and message content can contain $&, $1 etc., which String.replace treats specially
    assert.equal(
        Translate('errors.cooldown', 'en-GB', { time: '$&', command: '$1' }),
        'Please wait $& before using the `$1` command again.'
    );
});
