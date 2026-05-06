import { Client, Embed } from 'discord.js';
import emojis from '../constants/emojis.json' with { type: 'json'};
import * as Embeds from '../utils/embed.js'; 
import * as ConsoleLogs from '../utils/logger.js'; 
import * as Timestamps from '../utils/timestamps.js';
import * as Permissions from '../utils/permissions.js';
import * as I18n from '../utils/i18n.js';
import * as math from '../utils/math.js';

class MushroomClient extends Client {
    constructor(options) {
        super(options);

        /**
         * @type {{
         *  Log: typeof ConsoleLogs.Log,
         *  LogData: typeof ConsoleLogs.LogData,
         *  Embed: typeof Embeds.Embed,
         *  Timestamp: typeof Timestamps.Timestamp,
         *  ShortTimestamp: typeof Timestamps.ShortTimestamp,
         *  PermissionCheck: typeof Permissions.PermissionCheck,
         *  DevPermissionCheck: typeof Permissions.DevPermissionCheck,
         *  Translate: typeof I18n.Translate,
         *  getOrdinalSuffix: typeof math.getOrdinalSuffix
         * }}
         */

        this.utils = {
            ...ConsoleLogs,
            ...Embeds,
            ...Timestamps,
            ...Permissions,
            ...I18n,
            ...math
        };

        this.customEmojis = emojis;

        /**
        * Global tracker for Voice XP.
        * Key: Member ID, Value: { time: Number, guildId: String, levelConfig: Object, levelUpChannel: Channel }
        * @type {Map<string, object>}
        */
        this.voiceTracker = new Map();
    }
};

export default MushroomClient;