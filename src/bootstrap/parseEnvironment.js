const SNOWFLAKE = /^\d{17,20}$/;

/**
 * @typedef {Object} Environment
 * @property {string} MONGO_URI
 * @property {string} DEFAULT_LANGUAGE - i18n locale code, defaults to en-GB
 * @property {boolean} DEVELOPER_MODE
 * @property {string} TOKEN - Bot token for the current mode (BOT_TOKEN, or BOT_TOKEN_DEV in developer mode)
 * @property {string} APPLICATION_ID - Application ID for the current mode
 * @property {string | null} DEV_GUILD_ID - Developer guild; dev commands and dev logs need it
 * @property {string[]} DEVELOPER_IDS - User IDs allowed to use developer-only commands
 * @property {string | null} COMMAND_CID - Dev log channel for command usage
 * @property {string | null} JOIN_GUILD_CID - Dev log channel for guild joins
 * @property {string | null} LEAVE_GUILD_CID - Dev log channel for guild leaves
 * @property {string | null} USER_LEVEL_CID - Dev log channel for level-ups
 * @property {string | null} VOTE_CID - Dev log channel for votes
 */

/**
 * Validates environment variables and builds the bot's config.
 * Pure (no exiting or logging) so it can be tested; environment.js handles failures.
 *
 * Only MONGO_URI and the token/application ID for the current mode are required.
 * Everything else is optional: unset, empty or 'none' all mean "not configured".
 *
 * @param {Record<string, string | undefined>} env - Usually process.env
 * @returns {{ env: Environment | null, errors: string[], warnings: string[] }} errors is empty when env is valid
 */
export function parseEnvironment(env) {
    const errors = [];
    const warnings = [];

    /** @param {string} name */
    const optional = (name) => {
        const value = env[name]?.trim();
        return value && value.toLowerCase() !== 'none' ? value : null;
    };

    /** @param {string} name */
    const required = (name) => {
        const value = optional(name);
        if (!value) errors.push(`${name} is required`);
        return value;
    };

    /** @param {string} name */
    const snowflake = (name, value = optional(name)) => {
        if (value && !SNOWFLAKE.test(value)) errors.push(`${name} must be a Discord ID (17-20 digits), got "${value}"`);
        return value;
    };

    const developerMode = optional('DEVELOPER_MODE') === 'true';
    const tokenName = developerMode ? 'BOT_TOKEN_DEV' : 'BOT_TOKEN';
    const applicationIdName = developerMode ? 'BOT_APPLICATION_ID_DEV' : 'BOT_APPLICATION_ID';

    const developerIds = (optional('DEVELOPER_IDS') ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
    for (const id of developerIds) snowflake('DEVELOPER_IDS', id);

    // Renamed from the misspelled JOIN_GUID_CID; the old name is still accepted so existing setups keep working
    let joinGuildChannel = optional('JOIN_GUILD_CID');
    if (!joinGuildChannel && optional('JOIN_GUID_CID')) {
        joinGuildChannel = optional('JOIN_GUID_CID');
        warnings.push('JOIN_GUID_CID is deprecated, rename it to JOIN_GUILD_CID');
    }

    const parsed = {
        MONGO_URI: required('MONGO_URI'),
        DEFAULT_LANGUAGE: optional('DEFAULT_LANGUAGE') ?? 'en-GB',

        DEVELOPER_MODE: developerMode,
        TOKEN: required(tokenName),
        APPLICATION_ID: snowflake(applicationIdName, required(applicationIdName)),

        DEV_GUILD_ID: snowflake('DEV_GUILD_ID'),
        DEVELOPER_IDS: developerIds,

        COMMAND_CID: snowflake('COMMAND_CID'),
        JOIN_GUILD_CID: snowflake('JOIN_GUILD_CID', joinGuildChannel),
        LEAVE_GUILD_CID: snowflake('LEAVE_GUILD_CID'),
        USER_LEVEL_CID: snowflake('USER_LEVEL_CID'),
        VOTE_CID: snowflake('VOTE_CID'),
    };

    return errors.length > 0 ? { env: null, errors, warnings } : { env: parsed, errors, warnings };
}
