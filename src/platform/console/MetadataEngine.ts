import { ReactNode } from "react";

import { z } from "zod";

export const EntityMetadataSchema = z.object({
  id: z.string(),
  labelPlural: z.string(),
  labelSingular: z.string(),
  apiEndpoint: z.string(),
  primaryKey: z.string(),
  permissions: z.object({
    read: z.array(z.string()),
    write: z.array(z.string()),
    delete: z.array(z.string()),
  }),
  list: z.object({
    columns: z.array(z.object({
      key: z.string(),
      label: z.string(),
      type: z.enum(["string", "number", "boolean", "date", "status", "badge", "code"]),
      sortable: z.boolean().optional(),
    })),
    defaultSort: z.object({
      key: z.string(),
      order: z.enum(["asc", "desc"]),
    }).optional(),
    actions: z.array(z.object({
      id: z.string(),
      label: z.string(),
      icon: z.string().optional(),
      type: z.enum(["primary", "secondary", "danger", "api_trigger"]),
      apiEndpoint: z.string().optional(),
      method: z.enum(["POST", "PUT", "DELETE"]).optional(),
      bulk: z.boolean().optional(),
    })).optional(),
  }),
  form: z.object({
    fields: z.array(z.object({
      key: z.string(),
      label: z.string(),
      type: z.enum(["text", "number", "email", "password", "select", "checkbox", "radio"]),
      required: z.boolean().optional(),
      options: z.array(z.object({
        label: z.string(),
        value: z.string()
      })).optional(),
    }))
  }).optional(),
});

export const DomainMetadataSchema = z.object({
  domain: z.string(),
  label: z.string(),
  icon: z.string().optional(),
  entities: z.record(z.string(), EntityMetadataSchema),
});

export type EntityMetadata = z.infer<typeof EntityMetadataSchema>;
export type DomainMetadata = z.infer<typeof DomainMetadataSchema>;

class MetadataEngineImpl {
  private schemas: Map<string, DomainMetadata> = new Map();

  registerSchema(domain: string, schema: unknown) {
    try {
      const parsed = DomainMetadataSchema.parse(schema);
      this.schemas.set(domain, parsed);
    } catch (e) {
      console.error(`Metadata Validation Failed for domain '${domain}':`, e);
      throw e;
    }
  }

  getSchema(domain: string): DomainMetadata | undefined {
    return this.schemas.get(domain);
  }

  getAllSchemas(): DomainMetadata[] {
    return Array.from(this.schemas.values());
  }
}

export const MetadataEngine = new MetadataEngineImpl();
