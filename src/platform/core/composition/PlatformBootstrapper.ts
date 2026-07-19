import { CompositionRoot } from './CompositionRoot';
import { ICompositionRoot } from './types';

export class PlatformBootstrapper {
  private container: ICompositionRoot;

  constructor() {
    this.container = new CompositionRoot();
  }

  public getContainer(): ICompositionRoot {
    return this.container;
  }

  public async boot(): Promise<void> {
    await this.container.boot();
  }

  public async shutdown(): Promise<void> {
    await this.container.shutdown();
  }
}
