import React, { useState } from "react";
import { EntityMetadata } from "../../platform/console/MetadataEngine";
import { Button } from "../ui/Button";

interface EntityFormProps {
  entity: EntityMetadata;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
}

export function EntityForm({ entity, onSubmit, onCancel, initialData }: EntityFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData || {});
  const [loading, setLoading] = useState(false);

  const formMeta = entity.form;
  if (!formMeta) {
    return (
      <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
        No form metadata defined for entity '{entity.id}'.
      </div>
    );
  }

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-4">
        {formMeta.fields.map((field) => (
          <div key={field.key} className="flex flex-col space-y-1">
            <label className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>

            {field.type === "select" ? (
              <select
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData[field.key] || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                required={field.required}
              >
                <option value="" disabled>Select {field.label}</option>
                {field.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : field.type === "checkbox" ? (
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                checked={!!formData[field.key]}
                onChange={(e) => handleChange(field.key, e.target.checked)}
                required={field.required}
              />
            ) : (
              <input
                type={field.type}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData[field.key] || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                required={field.required}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
