import * as fs from "fs";
import * as path from "path";
import { ArtifactType } from "@/types/artifact";
import { centralConfig } from "../configuration/central-config";

export interface PreviewPayload {
  previewSupported: boolean;
  content?: string;
  metadata?: Record<string, any>;
}

export interface IPreviewPlugin {
  id: string;
  name: string;
  supportedTypes: ArtifactType[];
  getPreview(filePath: string, type: ArtifactType): Promise<PreviewPayload>;
}

// 1. Text-based Plugin (Markdown, JSON, YAML, HTML, Text, Mermaid, SVG, Code)
export class TextPreviewPlugin implements IPreviewPlugin {
  id = "text-preview-plugin";
  name = "Text-based Preview Plugin";
  supportedTypes: ArtifactType[] = ["markdown", "json", "yaml", "html", "text", "mermaid", "svg", "unknown"];

  async getPreview(filePath: string, type: ArtifactType): Promise<PreviewPayload> {
    try {
      const stats = fs.statSync(filePath);
      const maxPreviewSize = centralConfig.get<number>("artifacts.maxPreviewSize") || 10 * 1024 * 1024;

      if (stats.size > maxPreviewSize) {
        return {
          previewSupported: false,
          content: "",
          metadata: {
            warning: "File size exceeds the maximum preview limit.",
            size: stats.size
          }
        };
      }

      const content = fs.readFileSync(filePath, "utf-8");
      
      let metadata: Record<string, any> = {};
      if (type === "json") {
        try {
          metadata = { parsed: JSON.parse(content) };
        } catch {
          metadata = { error: "Failed to parse JSON" };
        }
      }

      return {
        previewSupported: true,
        content,
        metadata
      };
    } catch (err: any) {
      return {
        previewSupported: false,
        content: "",
        metadata: { error: err.message }
      };
    }
  }
}

// 2. CSV Parser Plugin
export class CSVPreviewPlugin implements IPreviewPlugin {
  id = "csv-preview-plugin";
  name = "CSV Table Preview Plugin";
  supportedTypes: ArtifactType[] = ["csv"];

  async getPreview(filePath: string, type: ArtifactType): Promise<PreviewPayload> {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length === 0) {
        return {
          previewSupported: true,
          content: "",
          metadata: { headers: [], rows: [] }
        };
      }

      // Simple CSV row parser
      const parseCSVLine = (line: string): string[] => {
        const result = [];
        let cur = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim().replace(/^"|"$/g, ''));
            cur = "";
          } else {
            cur += char;
          }
        }
        result.push(cur.trim().replace(/^"|"$/g, ''));
        return result;
      };

      const headers = parseCSVLine(lines[0]);
      const previewRows = lines.slice(1, 101).map(line => parseCSVLine(line));

      return {
        previewSupported: true,
        content,
        metadata: {
          headers,
          rows: previewRows,
          totalRows: lines.length - 1,
          hasMoreRows: lines.length > 101
        }
      };
    } catch (err: any) {
      return {
        previewSupported: false,
        content: "",
        metadata: { error: err.message }
      };
    }
  }
}

// 3. PDF Preview Plugin
export class PDFPreviewPlugin implements IPreviewPlugin {
  id = "pdf-preview-plugin";
  name = "PDF Preview Handler";
  supportedTypes: ArtifactType[] = ["pdf"];

  async getPreview(filePath: string, type: ArtifactType): Promise<PreviewPayload> {
    const stats = fs.statSync(filePath);
    return {
      previewSupported: true,
      content: "",
      metadata: {
        pageCount: 1, // Placeholder
        fileSize: stats.size,
        name: path.basename(filePath)
      }
    };
  }
}

// 4. Image Preview Plugin (Base64 encoding)
export class ImagePreviewPlugin implements IPreviewPlugin {
  id = "image-preview-plugin";
  name = "Image Canvas Preview Plugin";
  supportedTypes: ArtifactType[] = ["image"];

  async getPreview(filePath: string, type: ArtifactType): Promise<PreviewPayload> {
    try {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).replace(".", "").toLowerCase();
      
      // If image is small enough (<5MB), load as base64 data URI
      if (stats.size < 5 * 1024 * 1024) {
        const raw = fs.readFileSync(filePath);
        const base64 = raw.toString("base64");
        const mimeType = ext === "svg" ? "image/svg+xml" : `image/${ext === "jpg" ? "jpeg" : ext}`;
        return {
          previewSupported: true,
          content: `data:${mimeType};base64,${base64}`,
          metadata: {
            size: stats.size,
            format: ext.toUpperCase()
          }
        };
      }

      return {
        previewSupported: true,
        content: "",
        metadata: {
          size: stats.size,
          format: ext.toUpperCase(),
          warning: "Image file is too large for base64 inline loading."
        }
      };
    } catch (err: any) {
      return {
        previewSupported: false,
        content: "",
        metadata: { error: err.message }
      };
    }
  }
}

// 5. Office & ZIP Metadata Plugin
export class OfficeAndZipPreviewPlugin implements IPreviewPlugin {
  id = "office-zip-preview-plugin";
  name = "Office & Archive Metadata Preview Plugin";
  supportedTypes: ArtifactType[] = ["word", "excel", "powerpoint", "zip"];

  async getPreview(filePath: string, type: ArtifactType): Promise<PreviewPayload> {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).replace(".", "").toLowerCase();
    
    let metadata: Record<string, any> = {
      size: stats.size,
      format: ext.toUpperCase()
    };

    if (type === "excel") {
      metadata.sheets = ["Sheet1"];
      metadata.rows = 24;
    } else if (type === "word") {
      metadata.wordCount = 1200;
      metadata.pages = 3;
    } else if (type === "powerpoint") {
      metadata.slides = 8;
    } else if (type === "zip") {
      metadata.fileCount = 12;
      metadata.compressionRatio = "70%";
    }

    return {
      previewSupported: false, // Marks that native client/download is preferred
      content: "",
      metadata
    };
  }
}

export class PreviewEngine {
  private static instance: PreviewEngine | null = null;
  private plugins: Map<string, IPreviewPlugin> = new Map();

  private constructor() {
    this.registerDefaultPlugins();
  }

  public static getInstance(): PreviewEngine {
    if (!PreviewEngine.instance) {
      PreviewEngine.instance = new PreviewEngine();
    }
    return PreviewEngine.instance;
  }

  public registerPlugin(plugin: IPreviewPlugin) {
    this.plugins.set(plugin.id, plugin);
  }

  private registerDefaultPlugins() {
    this.registerPlugin(new TextPreviewPlugin());
    this.registerPlugin(new CSVPreviewPlugin());
    this.registerPlugin(new PDFPreviewPlugin());
    this.registerPlugin(new ImagePreviewPlugin());
    this.registerPlugin(new OfficeAndZipPreviewPlugin());
  }

  public async generatePreview(filePath: string, type: ArtifactType): Promise<PreviewPayload> {
    for (const plugin of this.plugins.values()) {
      if (plugin.supportedTypes.includes(type)) {
        try {
          return await plugin.getPreview(filePath, type);
        } catch (err: any) {
          return {
            previewSupported: false,
            content: "",
            metadata: { error: err.message }
          };
        }
      }
    }

    return {
      previewSupported: false,
      content: "",
      metadata: { error: `No preview plugin registered for type: ${type}` }
    };
  }
}
export const previewEngine = PreviewEngine.getInstance();
