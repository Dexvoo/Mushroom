import { ENV } from '../core/env.js';
import enUS from '../locales/en-US.js';
import esES from '../locales/es-ES.js';
import fr from '../locales/fr.js';
import de from '../locales/de.js';

const locales = {
    'en-GB': enUS,
    'en-US': enUS,
    'es-ES': esES,
    'fr-FR': fr,
    'de-DE': de,
};

const defaultLocale = ENV.DEFAULT_LANGUAGE;

/**
 * Translates a key into the requested locale string.
 * 
 * @param {string} key - The dot-notated key (e.g., 'ping.latency')
 * @param {import('discord.js').Locale} locale - The interaction.locale from Discord
 * @param {object}[args={}] - Variables to replace in the string (e.g., { ms: 120 })
 * @returns {string} The translated string
 */
function Translate(key, locale = defaultLocale, args = {}) {
    const lang = locales[locale] || locales[defaultLocale];
    
    const keys = key.split('.');
    let text = lang;
    
    for (const k of keys) {
        text = text?.[k];
    }

    if (text === undefined && locale !== defaultLocale) {
        return Translate(key, defaultLocale, args);
    }

    if (text === undefined) {
        return key; 
    }

    for (const[k, v] of Object.entries(args)) {
        text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
    }

    return text;
}

export { Translate };