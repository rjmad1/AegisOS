import { ResolvedParticipantDescriptor } from '../descriptors/types';

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  descriptor: ResolvedParticipantDescriptor;
}

/**
 * DescriptorRegistry
 * 
 * Stores and resolves domain templates and base descriptors.
 * In a real implementation, this might read from a database or YAML configs.
 */
export class DescriptorRegistry {
  private templates: Map<string, TemplateDefinition> = new Map();

  /**
   * Registers a domain template in the registry.
   */
  public registerTemplate(template: TemplateDefinition): void {
    if (this.templates.has(template.id)) {
      throw new Error(`Template with id '${template.id}' is already registered.`);
    }
    this.templates.set(template.id, template);
  }

  /**
   * Retrieves a template by its ID.
   */
  public getTemplate(id: string): TemplateDefinition | undefined {
    return this.templates.get(id);
  }

  /**
   * Retrieves all registered templates.
   */
  public listTemplates(): TemplateDefinition[] {
    return Array.from(this.templates.values());
  }

  /**
   * Deletes a template from the registry.
   */
  public unregisterTemplate(id: string): boolean {
    return this.templates.delete(id);
  }
}
