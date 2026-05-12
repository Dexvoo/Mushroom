import mongoose from 'mongoose';
import { ENV } from '../bootstrap/environment.js';
import { LogData } from '../shared/utils/logger.js';
import { Shutdown } from './shutdown.js';
import Client from '../structures/extendedClient.js'

export async function Database_Connect() {
    try {
        await mongoose.connect(ENV.MONGO_URI);
        LogData('MongoDB', 'Connected to the database successfully.', 'success');
    } catch (error) {
        LogData('MongoDB', `Failed to connect: ${error.message}`, 'error');
        // TODO: ADD SHUTDOWN FUNCTION
        await Shutdown('DATABASE FAILURE', Client)
    }
}

export async function Database_Disconnect() {

    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            LogData('MongoDB', 'Disconnected from the database successfully.', 'success');
        }
    } catch (error) {
        LogData('MongoDB', `Failed to disconnect from server: ${error.message}`, 'error');
    }
}