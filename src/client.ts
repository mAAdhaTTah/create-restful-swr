/**
 * Rest client interface.
 *
 * The Rest Client provides a consistent interface for interacting with a collection
 * & resource. This is based off the typical REST API structure.
 *
 * @template RT Record type
 * @template CT Collection type
 * @template LP List params
 * @template CP Create params
 * @template UP Update params
 */
export interface RestClient<RT, CT, LP, CP, UP> {
  /**
   * Fetch the collection
   *
   * Accepts a set of parameters which can be used to filter the collection.
   * These params will be used as part of the cache key.
   *
   * Typically associated with GET /collection.
   *
   * @param params List params
   * @returns Promise of a collection.
   */
  list(params?: LP): Promise<CT>;

  /**
   * Create a new resource.
   *
   * Typically associated with POST /collection.
   *
   * @param params Create params.
   * @returns Promise of the created resource.
   */
  create(params: CP): Promise<RT>;

  /**
   * Fetch a resource with the given id.
   *
   * Typically associated with GET /collection/:id.
   *
   * @param id Id of the resource to view.
   * @returns Promise of the viewed resource.
   */
  view(id: string): Promise<RT>;

  /**
   * Update a resource with the given params.
   *
   * Typically associated with PUT /collection/:id.
   *
   * @param id Id of the resource to update
   * @param params Values to update the resource with.
   * @returns Promise of the updated resource.
   */
  update(id: string, params: UP): Promise<RT>;

  /**
   * Partially update a resource with the given params.
   *
   * Typically associated with PATCH /collection/:id.
   *
   * @param id Id of the resource to partially update
   * @param params Values to update the resource with.
   * @returns Promise of the partially updated resource.
   */
  partial(id: string, params: Partial<UP>): Promise<RT>;

  /**
   * Delete a resource.
   *
   * Typically associated with DELETE /collection/:id.
   *
   * @param id Id of the resource to delete.
   */
  remove(id: string): Promise<void>;
}

/**
 * Hook that returns a Rest client.
 *
 * This is always called in "hook position" so you can use dependent hooks
 * to create teh Rest client, if needed.
 *
 * See {@link RestClient | RestClient} for info on what needs to be returned.
 *
 * @template RT Record type
 * @template CT Collection type
 * @template LP List params
 * @template CP Create params
 * @template UP Update params
 */
export type useRestClientHook<RT, CT, LP, CP, UP> = () => RestClient<
  RT,
  CT,
  LP,
  CP,
  UP
>;

/**
 * Implementation of a basic REST client.
 *
 * This can be used by default if no to minimal customization is necessary.
 *
 * @template RT Record type
 * @template CT Collection type
 * @template LP List params
 * @template CP Create params
 * @template UP Update params
 */
class DefaultRestClient<RT, CT, LP extends Record<string, string>, CP, UP>
  implements RestClient<RT, CT, LP, CP, UP> {
  /**
   * @param collectionUrl Url of the collection.
   */
  constructor(private collectionUrl: string) {}

  /**
   * @inheritdoc
   */
  async list(params?: LP): Promise<CT> {
    let path = this.collectionUrl;

    if (params) {
      path += '?' + new URLSearchParams(params);
    }

    const response = await fetch(path);

    if (response.status !== 200) {
      throw new Error();
    }

    const body = await response.json();
    return body;
  }

  /**
   * @inheritdoc
   */
  async create(params: CP): Promise<RT> {
    const response = await fetch(this.collectionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (response.status !== 201) {
      throw new Error();
    }

    const body = await response.json();
    return body;
  }

  /**
   * @inheritdoc
   */
  async view(id: string): Promise<RT> {
    const response = await fetch(`${this.collectionUrl}/${id}`);

    if (response.status !== 200) {
      throw new Error();
    }

    const body = await response.json();
    return body;
  }

  /**
   * @inheritdoc
   */
  async update(id: string, params: UP): Promise<RT> {
    const response = await fetch(`${this.collectionUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (response.status !== 200) {
      throw new Error();
    }

    const body = await response.json();
    return body;
  }

  /**
   * @inheritdoc
   */
  async partial(id: string, params: Partial<UP>): Promise<RT> {
    const response = await fetch(`${this.collectionUrl}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (response.status !== 200) {
      throw new Error();
    }

    const body = await response.json();
    return body;
  }

  /**
   * @inheritdoc
   */
  async remove(id: string): Promise<void> {
    const response = await fetch(`${this.collectionUrl}/${id}`, {
      method: 'DELETE',
    });

    if (response.status !== 200) {
      throw new Error();
    }
  }
}

/**
 * Create a default useRestClient hook that returns the default Rest client.
 *
 * @param collectionUrl Url of the collection.
 * @returns useRestClient hook to return the client.
 */
export const createDefaultUseRestClient = <
  RT,
  CT,
  LP extends Record<string, string>,
  CP,
  UP
>(
  collectionUrl: string,
) => {
  const client = new DefaultRestClient<RT, CT, LP, CP, UP>(collectionUrl);
  return function useRestClient(): RestClient<RT, CT, LP, CP, UP> {
    return client;
  };
};
