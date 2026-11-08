/**
 * Clipboard operations and WhatsApp tab management
 * Ensures image is converted to PNG format for reliable pasting into WhatsApp Web
 */

export interface ClipboardResult {
  success: boolean;
  message?: string;
}

/**
 * Converts an image from an object URL to PNG via an HTML canvas,
 * and writes it to the system clipboard using the async Clipboard API.
 * Must be invoked directly within a user gesture (click event handler).
 */
export async function copyImageToClipboard(objectUrl: string): Promise<ClipboardResult> {
  if (!navigator.clipboard || !navigator.clipboard.write || typeof ClipboardItem === 'undefined') {
    return {
      success: false,
      message: 'Browser Clipboard API for images is not supported in this environment.',
    };
  }

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      if (img.complete) {
        resolve();
      } else {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image into canvas'));
      }
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { success: false, message: 'Canvas 2D context unavailable.' };
    }

    ctx.drawImage(img, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png');
    });

    if (!blob) {
      return { success: false, message: 'Could not create PNG blob from canvas.' };
    }

    const clipboardItem = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([clipboardItem]);

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: msg || 'Clipboard write permission denied or blocked.',
    };
  }
}

/**
 * Copies plain text to clipboard
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older environments
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

/**
 * Reusable window name for WhatsApp Web so 200 tabs do not open
 */
export const WHATSAPP_TAB_NAME = 'troika_whatsapp_tab';

/**
 * Opens a WhatsApp chat link in the reusable tab
 * Returns { opened: boolean, blocked: boolean, windowRef: Window | null }
 */
export function openWhatsAppChatTab(url: string): {
  opened: boolean;
  blocked: boolean;
} {
  try {
    if (url.startsWith('whatsapp://')) {
      // Custom protocol for Windows Desktop App
      const link = document.createElement('a');
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { opened: true, blocked: false };
    }

    const win = window.open(url, WHATSAPP_TAB_NAME);
    if (!win || win.closed || typeof win.closed === 'undefined') {
      return { opened: false, blocked: true };
    }
    win.focus();
    return { opened: true, blocked: false };
  } catch {
    return { opened: false, blocked: true };
  }
}
