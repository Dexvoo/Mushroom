import mongoose from 'mongoose';
import { ENV } from './environment.js';
import { LogData } from '../shared/utils/logger.js';
import User_Levels_Cache from '../features/levels/cache/userLevels.cache.js'
import { Database_Disconnect } from './database.js';

export async function Shutdown(signal, client) {
    LogData('Shutdown Initiated', `Received ${signal}. Closing connections cleanly...`, 'warning');

    try {
        if (client) {
            client.destroy();
        }

        if (User_Levels_Cache?.flush) {
            await User_Levels_Cache.flush();
        }
        
        await Database_Disconnect()

        process.exit(0);

    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};