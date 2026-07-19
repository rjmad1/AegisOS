import { AsyncLocalStorage } from 'async_hooks';
import { TenantContext } from './types';

export class TenantContextStorage {
  private static storage = new AsyncLocalStorage<TenantContext>();

  public static run<R>(context: TenantContext, callback: () => R): R {
    return this.storage.run(context, callback);
  }

  public static getContext(): TenantContext | undefined {
    return this.storage.getStore();
  }

  public static requireContext(): TenantContext {
    const context = this.getContext();
    if (!context) {
      throw new Error('TenantContext is required but not found in current execution scope.');
    }
    return context;
  }
}
