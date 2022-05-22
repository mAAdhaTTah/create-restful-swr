import { Key } from 'swr';

/**
 * Adapter for a resource.
 *
 * Responsible for adapting a RESTful collections & resources into a common type.
 * For a resource, it's responsible for determining the id of a given resource with
 * the `id` method. For a collection, it's responsible for upserting or removing a
 * resource from the collection, or adapting a collection to a common "array of resources"
 * representation. This enables CRS to work flexibly for a variety of RESTful representations.
 *
 * @template LP List params
 * @template CT Collection type
 * @template RT Resource type
 */
export interface ResourceAdapter<LP, CT, RT> {
  /**
   * Get the id for a given resource.
   *
   * @param resource Resource to get the id for.
   * @returns Id of the resource.
   */
  id(resource: RT): string;

  /**
   * Create the SWR key for the given resource or resource id.
   *
   * The function has to handle both cases because there are methods
   * like `delete` which don't have resources to act on but are given
   * ids. We need to be able to create the cache key for both cases.
   *
   * @param resource Resource to create the key for.
   * @returns SWR key for the resource.
   */
  resourceKey(resource: RT | string): Key;

  /**
   * Create the SWR key for the given collection params.
   *
   * @param params List parameters to filter the API by.
   * @returns SWR key for the collection.
   */
  collectionKey(params?: LP): Key;

  /**
   * Map the collection type into an array of resources.
   *
   * This list is used to push the resources into the cache after
   * loading from the collection, so we need to map it down to a
   * list so we can cache everything.
   *
   * @param collection Collection to read from.
   * @returns Array of resources.
   */
  all(collection: CT): RT[];

  /**
   * Update or insert ("upsert") a resource in a collection.
   *
   * This can use `defaultUpsert` to pull the array of resources
   * and run it through the default logic for upserting a resource,
   * using the `adapter` to match the `id`.
   *
   * @param resource Resource to upsert into the collection.
   * @param collection Collection to upsert into.
   * @returns Upserted collection.
   */
  upsert(resource: RT, collection: CT): CT;

  /**
   * Remove a resource from a collection.
   *
   * This can use `defaultFilter` to remove a resource from
   * an array of resources, using the `adapter` to match the `id`.
   *
   * @param id Id of the resource to remove.
   * @param collection Collection to remove resource from.
   * @returns Collection with resource removed.
   */
  remove(id: string, collection: CT): CT;
}

/**
 * Default upsert function for adding a resource to a collection.
 *
 * @template RT Resource type.
 * @param adapt Adapter for the resource.
 * @param resource Resource to upsert.
 * @param collection Collection to upsert into.
 * @returns Whether it was inserted & result of the upsert.
 */
export function defaultUpsert<RT>(
  adapt: ResourceAdapter<any, any, RT>,
  resource: RT,
  collection: RT[],
): {
  inserted: boolean;
  result: RT[];
} {
  let inserted = true;

  const updated = collection.map(r => {
    const isElement = adapt.id(r) === adapt.id(resource);

    if (isElement) {
      inserted = false;
      return resource;
    }

    return r;
  });

  const result = (!inserted ? updated : [...collection, resource]) as RT[];

  return { inserted, result };
}

/**
 * Default filter function for removing a resource from a collection.
 *
 * @template RT Resource type.
 * @param adapt Adapter for the resource.
 * @param id Id of resource to remove from the collection.
 * @param collection Collection to remove resource from.
 * @returns Whether resource was removed & result of the filter.
 */
export function defaultFilter<RT>(
  adapt: ResourceAdapter<any, any, RT>,
  id: string,
  collection: RT[],
): {
  removed: boolean;
  result: RT[];
} {
  let removed = false;
  const result = collection.filter(r => {
    const isElement = adapt.id(r) === id;
    if (isElement) {
      removed = true;
    }
    return !isElement;
  });

  return { removed, result };
}

/**
 * Default implementation of a REST adapter.
 *
 * `cacheKey` & `idKey` are used for basic examples, where the collection
 * is an array of resources & the resources have a property (`idKey`) on
 * them as their unique identifier. `cacheKey` can be any unique string
 * but is typically the collection url.
 *
 * @template LP List params.
 * @template RK Resource key.
 * @template CT Collection type.
 * @template RT Resource type.
 */
export class DefaultRestAdapter<
  LP,
  RK extends string,
  CT extends RT[],
  RT extends { [K in RK]: string }
> implements ResourceAdapter<LP, CT, RT> {
  /**
   * Construct a configured rest adapter.
   *
   * @param cacheKey SWR cache key prefix.
   * @param idKey Property on the resource with unique identifier.
   */
  constructor(private cacheKey: string, private idKey: RK) {}

  /**
   * @inheritdoc
   */
  resourceKey(resource: RT | string): Key {
    return [
      this.cacheKey,
      typeof resource === 'string' ? resource : this.id(resource),
    ];
  }

  /**
   * @inheritdoc
   */
  collectionKey(params?: LP): Key {
    return [this.cacheKey, params];
  }

  /**
   * @inheritdoc
   */
  id(resource: RT) {
    return resource[this.idKey];
  }

  /**
   * @inheritdoc
   */
  all(collection: CT) {
    return collection;
  }

  /**
   * @inheritdoc
   */
  upsert(resource: RT, collection: CT): CT {
    return defaultUpsert(this, resource, collection).result as CT;
  }

  /**
   * @inheritdoc
   */
  remove(id: string, collection: CT): CT {
    return defaultFilter(this, id, collection).result as CT;
  }
}
