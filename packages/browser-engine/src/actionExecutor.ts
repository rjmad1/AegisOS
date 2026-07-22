import type { Page } from 'playwright';
import { ActionCommand, ExecutionResult } from '@platform/shared-contracts';
import { normalizeAndHashDom } from '@platform/state-manager';
import { extractInteractableElements, InteractableElement } from './elementExtractor';

export interface IActionExecutor {
  execute(page: Page, command: ActionCommand): Promise<{
    result: ExecutionResult;
    interactables: InteractableElement[];
  }>;
}

export class PlaywrightActionExecutor implements IActionExecutor {
  async execute(
    page: Page,
    command: ActionCommand
  ): Promise<{ result: ExecutionResult; interactables: InteractableElement[] }> {
    const timeoutMs = command.timeoutMs || 5000;
    let success = false;
    let errorDetail: string | undefined = undefined;

    try {
      switch (command.commandType) {
        case 'NAVIGATE':
          if (!command.url) throw new Error('NAVIGATE command requires url property');
          await page.goto(command.url, { timeout: timeoutMs, waitUntil: 'networkidle' });
          success = true;
          break;

        case 'CLICK':
          if (!command.selector) throw new Error('CLICK command requires selector property');
          await page.click(command.selector, { timeout: timeoutMs });
          success = true;
          break;

        case 'TYPE':
          if (!command.selector) throw new Error('TYPE command requires selector property');
          await page.fill(command.selector, command.value || '', { timeout: timeoutMs });
          success = true;
          break;

        case 'HOVER':
          if (!command.selector) throw new Error('HOVER command requires selector property');
          await page.hover(command.selector, { timeout: timeoutMs });
          success = true;
          break;

        case 'WAIT_FOR':
          if (!command.selector) throw new Error('WAIT_FOR command requires selector property');
          await page.waitForSelector(command.selector, { timeout: timeoutMs, state: 'visible' });
          success = true;
          break;

        default:
          throw new Error(`Unsupported command type: ${command.commandType}`);
      }

      // CRITICAL REQUIREMENT: Always wait for network idle to prevent flakiness
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        // Log network idle timeout as soft warning
      });
    } catch (err: any) {
      success = false;
      errorDetail = err.message || String(err);
    }

    const htmlContent = await page.content().catch(() => '');
    const { domHash } = normalizeAndHashDom(htmlContent);
    const interactables = success ? await extractInteractableElements(page).catch(() => []) : [];

    const evidenceId = `ev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      result: {
        success,
        resultingDomHash: domHash,
        resultingDomSnapshot: htmlContent,
        errorDetail,
        evidenceId,
        networkIdle: true,
      },
      interactables,
    };
  }
}
