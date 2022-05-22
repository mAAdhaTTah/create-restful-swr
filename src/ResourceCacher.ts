import { ScopedMutator } from 'swr/dist/types';
import { ResourceAdapter } from './adapter';
import { RestClient } from './client';

/**
 * @private
 */
export class ResourceCacher<RT, CT, LP, CP, UP> {
  /**
   * @private
   */
  constructor(
    private client: RestClient<RT, CT, LP, CP, UP>,
    private adapter: ResourceAdapter<LP, CT, RT>,
    private mutate: ScopedMutator,
  ) {}

  /**
   * @private
   */
  async listResources(params?: LP) {
    const collection = await this.client.list(params);

    await this.mutate(this.adapter.collectionKey(params), collection, {
      revalidate: false,
    });

    for (const resource of this.adapter.all(collection)) {
      const resourceKey = this.adapter.resourceKey(resource);
      await this.mutate(resourceKey, resource, {
        revalidate: false,
      });
    }

    return collection;
  }

  /**
   * @private
   */
  async createResource(params: CP) {
    const resource = await this.client.create(params);

    const resourceKey = this.adapter.resourceKey(resource);

    await this.mutate(
      this.adapter.collectionKey(),
      (collection: CT | undefined) =>
        collection && this.adapter.upsert(resource, collection),
      { revalidate: false },
    );
    await this.mutate(resourceKey, resource, {
      revalidate: false,
    });

    return resource;
  }

  /**
   * @private
   */
  async viewResource(id: string) {
    const resource = await this.client.view(id);

    await this.mutate(
      this.adapter.collectionKey(),
      (collection: CT | undefined) =>
        collection && this.adapter.upsert(resource, collection),
      {
        revalidate: false,
      },
    );
    await this.mutate(this.adapter.resourceKey(resource), resource, {
      revalidate: false,
    });

    return resource;
  }

  /**
   * @private
   */
  async updateResource(id: string, params: UP) {
    const resource = await this.client.update(id, params);

    await this.mutate(
      this.adapter.collectionKey(),
      (collection: CT | undefined) =>
        collection && this.adapter.upsert(resource, collection),
      {
        revalidate: false,
      },
    );
    await this.mutate(this.adapter.resourceKey(resource), resource, {
      revalidate: false,
    });

    return resource;
  }

  /**
   * @private
   */
  async partialResource(id: string, params: Partial<UP>) {
    const resource = await this.client.partial(id, params);

    await this.mutate(
      this.adapter.collectionKey(),
      (collection: CT | undefined) =>
        collection && this.adapter.upsert(resource, collection),
      {
        revalidate: false,
      },
    );
    await this.mutate(this.adapter.resourceKey(resource), resource, {
      revalidate: false,
    });

    return resource;
  }

  /**
   * @private
   */
  async removeResource(id: string) {
    const response = await this.client.remove(id);
    const resourceKey = this.adapter.resourceKey(id);

    await this.mutate(
      this.adapter.collectionKey(),
      (collection: CT | undefined) =>
        collection && this.adapter.remove(id, collection),
      {
        revalidate: false,
      },
    );
    await this.mutate(resourceKey, null, {
      revalidate: false,
    });

    return response;
  }
}
