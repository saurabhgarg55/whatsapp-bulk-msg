/**
 * Vitest tests for Message Template Personalization and Link Building
 */

import { describe, it, expect } from 'vitest';
import { personalizeMessage, buildWhatsAppLink } from './template';

describe('Template Personalization', () => {
  it('replaces {name} with dealer clean name', () => {
    const template = 'Hello {name}, welcome to Troika International.';
    const result = personalizeMessage(template, 'Annapurna Sanitary');
    expect(result).toBe('Hello Annapurna Sanitary, welcome to Troika International.');
  });

  it('replaces variations: {Name}, { name }, {NAME}', () => {
    expect(personalizeMessage('Dear {Name},', 'Everest Tiles')).toBe('Dear Everest Tiles,');
    expect(personalizeMessage('Dear { name },', 'Everest Tiles')).toBe('Dear Everest Tiles,');
    expect(personalizeMessage('Dear {NAME},', 'Everest Tiles')).toBe('Dear Everest Tiles,');
    expect(personalizeMessage('Dear {  NaMe  },', 'Everest Tiles')).toBe('Dear Everest Tiles,');
  });

  it('falls back to "Sir/Madam" when dealer name is empty or whitespace', () => {
    const template = 'Dear {name}, your Troika catalog is ready.';
    expect(personalizeMessage(template, '')).toBe('Dear Sir/Madam, your Troika catalog is ready.');
    expect(personalizeMessage(template, '   ')).toBe('Dear Sir/Madam, your Troika catalog is ready.');
    expect(personalizeMessage(template, undefined)).toBe('Dear Sir/Madam, your Troika catalog is ready.');
  });

  it('appends opt-out STOP notice when requested', () => {
    const template = 'Hi {name},\nCheck out our new bathware collection.';
    const result = personalizeMessage(template, 'Pokhara Bath', true);
    expect(result).toContain('Reply STOP if you do not want these messages.');
  });

  it('does not duplicate STOP notice if already present', () => {
    const template = 'Hi {name}.\nReply STOP if you do not want these messages.';
    const result = personalizeMessage(template, 'Pokhara Bath', true);
    const count = (result.match(/Reply STOP/g) || []).length;
    expect(count).toBe(1);
  });
});

describe('WhatsApp Link Building', () => {
  it('builds Windows WhatsApp Desktop App link by default', () => {
    const phone = '9779841234567';
    const message = 'Line 1\nLine 2';
    const link = buildWhatsAppLink(phone, message); // uses default desktop

    expect(link).toBe(
      'whatsapp://send?phone=9779841234567&text=Line%201%0ALine%202'
    );
  });

  it('builds Windows WhatsApp Desktop App link (whatsapp:// protocol)', () => {
    const phone = '9779841234567';
    const message = 'Hello Troika 🎉';
    const link = buildWhatsAppLink(phone, message, 'desktop', 'prefill');

    expect(link).toBe('whatsapp://send?phone=9779841234567&text=Hello%20Troika%20%F0%9F%8E%89');
  });

  it('builds wa.me universal link when requested', () => {
    const phone = '9779841234567';
    const message = 'Hello Troika & Friends? #1 New Collection 🎉';
    const link = buildWhatsAppLink(phone, message, 'wame', 'prefill');

    expect(link).toBe(
      'https://wa.me/9779841234567?text=Hello%20Troika%20%26%20Friends%3F%20%231%20New%20Collection%20%F0%9F%8E%89'
    );
  });

  it('builds links without prefill text when messageMode is blank', () => {
    const phone = '9779841234567';
    const message = 'Some message that should be omitted in blank mode';

    expect(buildWhatsAppLink(phone, message, 'web', 'blank')).toBe(
      'https://web.whatsapp.com/send/?phone=9779841234567'
    );
    expect(buildWhatsAppLink(phone, message, 'desktop', 'blank')).toBe(
      'whatsapp://send?phone=9779841234567'
    );
    expect(buildWhatsAppLink(phone, message, 'wame', 'blank')).toBe(
      'https://wa.me/9779841234567'
    );
  });
});
