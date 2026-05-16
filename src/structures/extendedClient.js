import { Client, Embed } from 'discord.js';
import emojis from '../shared/constants/emojis.json' with { type: 'json'};
import * as Embeds from '../shared/utils/embed.js'; 
import * as ConsoleLogs from '../shared/utils/logger.js'; 
import * as Timestamps from '../shared/utils/timestamps.js';
import * as Permissions from '../shared/utils/permissions.js';
import * as I18n from '../shared/utils/i18n.js';
import * as Math from '../shared/utils/math.js';
import * as String from '../shared/utils/string.js';
import { CooldownManager } from '../shared/cache/cooldowns.js';

class MushroomClient extends Client {
    constructor(options) {
        super(options);

        /**
         * @type {{
         *  Log: typeof ConsoleLogs.Log,
         *  LogData: typeof ConsoleLogs.LogData,
         *  Embed: typeof Embeds.Embed,
         *  DevEmbed: typeof Embeds.DevEmbed,
         *  Timestamp: typeof Timestamps.Timestamp,
         *  ShortTimestamp: typeof Timestamps.ShortTimestamp,
         *  PermissionCheck: typeof Permissions.PermissionCheck,
         *  DevPermissionCheck: typeof Permissions.DevPermissionCheck,
         *  Translate: typeof I18n.Translate,
         *  GetOrdinalSuffix: typeof Math.GetOrdinalSuffix,
         *  Truncate: typeof String.Truncate
         * }}
         */

        this.utils = {
            ...ConsoleLogs,
            ...Embeds,
            ...Timestamps,
            ...Permissions,
            ...I18n,
            ...Math,
            ...String,
        };

        this.customEmojis = emojis;

        /**
         * Global cooldown manager.
         * Used for commands, message XP, reactions, dailies, etc.
         * @type {CooldownManager}
         */
        this.cooldowns = new CooldownManager();
    }
};

export default MushroomClient;