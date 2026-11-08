/**
 * Message template personalization and WhatsApp link generator
 */

import { LinkType, MessageMode } from '../types';

/**
 * Replaces {name}, {Name}, { name }, {NAME} with dealer clean name.
 * If empty, defaults to 'Sir/Madam'.
 */
export function personalizeMessage(
  template: string,
  dealerName?: string,
  appendStopNotice: boolean = false
): string {
  const safeName = dealerName && dealerName.trim().length > 0 ? dealerName.trim() : 'Sir/Madam';

  // Replace {name}, {Name}, {NAME}, with optional whitespace like { name }
  let rendered = template.replace(/\{\s*name\s*\}/gi, safeName);

  if (appendStopNotice) {
    const stopText = 'Reply STOP if you do not want these messages.';
    if (!rendered.includes(stopText)) {
      rendered = rendered.trimEnd() + '\n\n' + stopText;
    }
  }

  return rendered;
}

/**
 * Generates the WhatsApp link for a given dealer phone and message
 */
export function buildWhatsAppLink(
  normalizedPhone: string,
  message: string,
  linkType: LinkType = 'desktop',
  messageMode: MessageMode = 'prefill'
): string {
  // If message mode is 'blank', we don't attach text in the query parameter
  const encodedText = messageMode === 'prefill' && message.trim() ? encodeURIComponent(message) : '';

  // 1. Direct WhatsApp Web (skips "Open App or Continue to Web" intermediate page)
  if (linkType === 'web') {
    if (encodedText) {
      return `https://web.whatsapp.com/send/?phone=${normalizedPhone}&text=${encodedText}`;
    }
    return `https://web.whatsapp.com/send/?phone=${normalizedPhone}`;
  }

  // 2. Windows WhatsApp Desktop App (opens the installed Windows application directly)
  if (linkType === 'desktop') {
    if (encodedText) {
      return `whatsapp://send?phone=${normalizedPhone}&text=${encodedText}`;
    }
    return `whatsapp://send?phone=${normalizedPhone}`;
  }

  // 3. wa.me format (universal fallback)
  if (encodedText) {
    return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
  }
  return `https://wa.me/${normalizedPhone}`;
}
