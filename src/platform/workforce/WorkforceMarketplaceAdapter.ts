import { marketplaceService } from '../marketplace/MarketplaceService';

export class WorkforceMarketplaceAdapter {
  private static instance: WorkforceMarketplaceAdapter | null = null;

  private constructor() {}

  public static getInstance(): WorkforceMarketplaceAdapter {
    if (!WorkforceMarketplaceAdapter.instance) {
      WorkforceMarketplaceAdapter.instance = new WorkforceMarketplaceAdapter();
    }
    return WorkforceMarketplaceAdapter.instance;
  }

  public async publishWorkforceAsset(asset: any, signature: string): Promise<boolean> {
    const marketplaceManifest = {
      ...asset,
      type: 'workforce-asset',
      capabilities: ['digital-workforce', asset.assetType]
    };
    
    const publishResult = await marketplaceService.publish(marketplaceManifest, signature);
    return publishResult.success;
  }
}

export const workforceMarketplaceAdapter = WorkforceMarketplaceAdapter.getInstance();
