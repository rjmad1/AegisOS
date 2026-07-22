import type { Page } from 'playwright';

export interface InteractableElement {
  selector: string;
  tagName: string;
  type?: string;
  text?: string;
  href?: string;
}

/**
 * Extracts interactable elements from a live Playwright page.
 */
export async function extractInteractableElements(page: Page): Promise<InteractableElement[]> {
  return await page.evaluate(() => {
    const interactables: InteractableElement[] = [];

    const selectors = [
      'button',
      'a[href]',
      'input',
      'select',
      'textarea',
      '[role="button"]',
      '[role="link"]',
      '[onclick]',
    ];

    const elements = document.querySelectorAll(selectors.join(','));

    elements.forEach((el, index) => {
      const htmlEl = el as HTMLElement;
      // Skip hidden or invisible elements
      if (htmlEl.offsetWidth === 0 || htmlEl.offsetHeight === 0) return;

      let uniqueSelector = '';
      if (htmlEl.id) {
        uniqueSelector = `#${htmlEl.id}`;
      } else if (htmlEl.getAttribute('name')) {
        uniqueSelector = `${htmlEl.tagName.toLowerCase()}[name="${htmlEl.getAttribute('name')}"]`;
      } else {
        uniqueSelector = `${htmlEl.tagName.toLowerCase()}:nth-of-type(${index + 1})`;
      }

      interactables.push({
        selector: uniqueSelector,
        tagName: htmlEl.tagName.toLowerCase(),
        type: htmlEl.getAttribute('type') || undefined,
        text: (htmlEl.innerText || htmlEl.getAttribute('aria-label') || '').trim().slice(0, 50),
        href: htmlEl.getAttribute('href') || undefined,
      });
    });

    return interactables;
  });
}
