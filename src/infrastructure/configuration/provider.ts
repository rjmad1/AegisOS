export interface IConfigurationProvider {
  get<T>(key: string, defaultValue?: T): T;
  has(key: string): boolean;
  set<T>(key: string, value: T): void;
  getProviderConfig(providerId: string): Record<string, any>;
}
