// import 'dotenv/config'
import { LogData } from '../utils/logger.js';

try {
    process.loadEnvFile();
} catch (error) {
    LogData('Environment Variables', 'Error occurred while loading environment variables.', 'error');
};

const requiredEnvVariables =[
    'MONGO_URI',

    'DEFAULT_LANGUAGE',

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

const missingEnvVariables = requiredEnvVariables.filter((envVar) => !process.env[envVar]);
if (missingEnvVariables.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVariables.join(', ')}`);
    process.exit(1);
}

export const ENV = {
    MONGO_URI: process.env.MONGO_URI,

    DEFAULT_LANGUAGE: process.env.DEFAULT_LANGUAGE || 'en-GB',

    DEVELOPER_MODE: process.env.DEVELOPER_MODE === 'true',
    DEV_GUILD_ID: process.env.DEV_GUILD_ID,

    BOT_TOKEN: process.env.BOT_TOKEN,
    BOT_APPLICATION_ID: process.env.BOT_APPLICATION_ID,
    
    BOT_TOKEN_DEV: process.env.BOT_TOKEN_DEV,
    BOT_APPLICATION_ID_DEV: process.env.BOT_APPLICATION_ID_DEV,
    
    DEVELOPER_IDS: process.env.DEVELOPER_IDS ? process.env.DEVELOPER_IDS.split(',').map(id => id.trim()) : [],

    COMMAND_CID: process.env.COMMAND_CID,
    JOIN_GUID_CID: process.env.JOIN_GUID_CID,
    LEAVE_GUILD_CID: process.env.LEAVE_GUILD_CID,
    USER_LEVEL_CID: process.env.USER_LEVEL_CID,
    VOTE_CID: process.env.VOTE_CID,
};