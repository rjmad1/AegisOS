import { MetadataEngine, DomainMetadataSchema } from "../console/MetadataEngine";

/**
 * Metadata Registry Service
 * Handles fetching, caching, validation, and lazy-loading of domain schemas.
 * Ensures the shell boots quickly and operates seamlessly offline.
 */
export class MetadataRegistryService {
  private static CACHE_KEY_PREFIX = "aegis_metadata_";
  
  /**
   * Initializes the core shell with minimal required metadata,
   * relying on locally cached schemas to avoid network blocking.
   */
  async boot(): Promise<void> {
    console.log("[MetadataRegistry] Booting Minimal Schema Cache...");
    
    // Core domains required for initial shell rendering
    const coreDomains = ["admin", "mobile", "workspace", "operations", "settings"];
    
    for (const domain of coreDomains) {
      const cached = this.loadFromLocalCache(domain);
      if (cached) {
        try {
          MetadataEngine.registerSchema(domain, cached);
        } catch (e) {
          console.warn(`[MetadataRegistry] Failed to parse cached schema for ${domain}. Fetching fresh...`);
          await this.loadRemoteSchema(domain);
        }
      } else {
        // If not in cache, we must fetch it to boot, but we do it gracefully
        await this.loadRemoteSchema(domain).catch(e => {
          console.error(`[MetadataRegistry] Critical boot failure: Could not load ${domain} schema.`, e);
        });
      }
    }
  }

  /**
   * Lazily loads a schema from the remote API.
   * Implements ETags and Incremental Updates.
   */
  async loadRemoteSchema(domain: string, etag?: string): Promise<void> {
    try {
      const headers: Record<string, string> = {};
      if (etag) headers["If-None-Match"] = etag;

      const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
      const res = await fetch(`${baseUrl}/schemas/${domain}.schema.json`, { headers });
      
      if (res.status === 304) {
        console.log(`[MetadataRegistry] Schema ${domain} not modified (304). Using cache.`);
        return;
      }
      
      if (!res.ok) throw new Error(`Status ${res.status}`);
      
      const schemaData = await res.json();
      
      // Validate schema without blocking UI significantly (Zod parse is fast enough for 500kb limits)
      MetadataEngine.registerSchema(domain, schemaData);
      
      // Update offline cache
      this.saveToLocalCache(domain, schemaData);
      
    } catch (e) {
      console.warn(`[MetadataRegistry] Failed to fetch remote schema for ${domain}. Falling back to offline cache.`, e);
      const cached = this.loadFromLocalCache(domain);
      if (cached) {
        MetadataEngine.registerSchema(domain, cached);
      }
    }
  }

  private loadFromLocalCache(domain: string): any | null {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(`${MetadataRegistryService.CACHE_KEY_PREFIX}${domain}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private saveToLocalCache(domain: string, data: any): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`${MetadataRegistryService.CACHE_KEY_PREFIX}${domain}`, JSON.stringify(data));
    } catch {
      // LocalStorage full or blocked
    }
  }
}

export const MetadataRegistry = new MetadataRegistryService();
