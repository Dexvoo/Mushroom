import fs from 'fs';
import path from 'path';

export async function checkVersion(LogData) {
    try {
        const packageJsonPath = path.resolve('./package.json');
        const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const currentVersion = packageData.version;

        if(!currentVersion) return LogData('Version Check', 'Current version not found in package.json.', 'error');

        const repoPath = 'Dexvoo/Ovx';
        const apiUrl = `https://api.github.com/repos/${repoPath}/releases/latest`;

        const response = await fetch(apiUrl, {
            headers: { 'User-Agent': 'MushroomBot-VersionCheck' }
        });

        if(!response.ok) return LogData('Version Check', `Failed to fetch latest release: ${response.status} ${response.statusText}`, 'error');

        const data = await response.json();

        const remoteVersion = data.tag_name.replace(/^v/, '');

        if(remoteVersion !== currentVersion) {
            LogData('Version Check', `A new version of Mushroom Bot is available! Current: ${currentVersion}, Latest: ${remoteVersion}. Please update to the latest version.`, 'warning');
        } else {
            LogData('Version Check', `You are running the latest version of Mushroom Bot (v${currentVersion}).`, 'success');
        }

    } catch (error) {
        LogData('Version Check', `Error occurred while checking version: ${error.message}`, 'error');
    }
};