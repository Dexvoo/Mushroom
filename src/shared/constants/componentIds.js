/**
 * Buttons and menus handled by a feature's own event, by custom ID prefix.
 * The catch-all in utility/events/slashCommands.js leaves these alone, so two handlers never answer the same click.
 */
export const HANDLED_COMPONENT_PREFIXES = Object.freeze([
    'ticket:', // features/tickets/events/ticketButtons.js
    'ovx-ticket-', // Ticket buttons from the old Ovx bot, still on panels in servers that used it
]);

/**
 * @param {string} customId
 */
export function isHandledComponent(customId) {
    return HANDLED_COMPONENT_PREFIXES.some((prefix) => customId.startsWith(prefix));
}
