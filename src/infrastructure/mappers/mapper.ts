export interface IMapper<TSource, TTarget> {
  map(source: TSource): TTarget;
  mapMany(sources: TSource[]): TTarget[];
}

export abstract class BaseMapper<TSource, TTarget> implements IMapper<TSource, TTarget> {
  abstract map(source: TSource): TTarget;

  mapMany(sources: TSource[]): TTarget[] {
    return sources.map((s) => this.map(s));
  }
}
