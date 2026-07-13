export interface MarketplaceItem {
  id: string;
  name: string;
  category: "prompts" | "tools" | "workflows";
  version: string;
  author: string;
  description: string;
  downloads: number;
  rating: number;
  payload: any; // The template, tool definition, or workflow definition
}

export class AIMarketplace {
  private static instance: AIMarketplace | null = null;
  private catalog: Map<string, MarketplaceItem> = new Map();

  private constructor() {
    this.seedMarketplace();
  }

  public static getInstance(): AIMarketplace {
    if (!AIMarketplace.instance) {
      AIMarketplace.instance = new AIMarketplace();
    }
    return AIMarketplace.instance;
  }

  private seedMarketplace(): void {
    const items: MarketplaceItem[] = [
      {
        id: "market:prompt:sql-coder",
        name: "Prisma Schema SQL Coder Prompt",
        category: "prompts",
        version: "2.1.0",
        author: "DevOps Expert",
        description: "Specialized prompt for writing Prisma query builders and schema compliance checking.",
        downloads: 1420,
        rating: 4.8,
        payload: {
          template: "You are a database engineer. Write Prisma queries matching schema definitions: {schema}.",
          variables: ["schema"],
        },
      },
      {
        id: "market:tool:docker-inspect",
        name: "Docker Container Inspect Tool",
        category: "tools",
        version: "1.0.4",
        author: "SRE Platform team",
        description: "Crawls running docker containers to inspect health status and network ports.",
        downloads: 850,
        rating: 4.5,
        payload: {
          parameters: {
            type: "object",
            properties: { containerId: { type: "string" } },
            required: ["containerId"],
          },
          permissionsRequired: ["docker:inspect"],
          sandboxLevel: "partial",
        },
      },
    ];

    for (const item of items) {
      this.catalog.set(item.id, item);
    }
  }

  public publish(item: MarketplaceItem): void {
    this.catalog.set(item.id, item);
    console.log(`[AIMarketplace] Published item ${item.id} of category ${item.category}`);
  }

  public search(query: string, category?: "prompts" | "tools" | "workflows"): MarketplaceItem[] {
    const list = Array.from(this.catalog.values());
    const q = query.toLowerCase();

    return list.filter((item) => {
      const matchQuery =
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q);
      
      const matchCategory = category ? item.category === category : true;

      return matchQuery && matchCategory;
    });
  }

  public getCatalog(): MarketplaceItem[] {
    return Array.from(this.catalog.values());
  }

  public getCatalogItem(id: string): MarketplaceItem | undefined {
    return this.catalog.get(id);
  }
}
export default AIMarketplace;
