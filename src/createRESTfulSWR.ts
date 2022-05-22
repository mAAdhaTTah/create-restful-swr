import { useCallback, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ResourceCacher } from './ResourceCacher';
import {
  CreateRESTfulSWRParams,
  RESTfulSWR,
  UseRESTfulSWRCollection,
  UseRESTfulSWRResource,
} from './types';

const assertId: (id: string | undefined) => asserts id is string = id => {
  if (!id) throw new Error(`id is undefined`);
};

/**
 * Create RESTful SWR hooks for managing a collection & resource.
 *
 * This is the core entrypoint of the package. The function returns two hooks,
 * `useSWRResource` & `useSWRCollection`, that work with SWR to keep the
 * resources in sync between the individual resources & the root collection.
 *
 * @template RT Resource type
 * @template CT Collection type
 * @template LP List params
 * @template CP Create params
 * @template UP Update params
 * @returns RESTful SWR hooks
 */
export const createRESTfulSWR = <RT, CT, LP, CP, UP>({
  adapter,
  useRestClient,
}: CreateRESTfulSWRParams<RT, CT, LP, CP, UP>): RESTfulSWR<
  RT,
  CT,
  LP,
  CP,
  UP
> => {
  const useSWRCollection: UseRESTfulSWRCollection<RT, CT, LP, CP, UP> = (
    params?: LP,
  ) => {
    const client = useRestClient();
    const { mutate } = useSWRConfig();
    const cacher = useMemo(() => new ResourceCacher(client, adapter, mutate), [
      client,
      mutate,
    ]);

    const response = useSWR(adapter.collectionKey(params), {
      fetcher: useCallback(() => client.list(params), [client, params]),
    });
    const api = useMemo(
      () => ({
        list: async () => cacher.listResources(params),
        create: async (params: CP) => cacher.createResource(params),
        view: async (id: string) => cacher.viewResource(id),
        update: async (id: string, params: UP) =>
          cacher.updateResource(id, params),
        partial: async (id: string, params: Partial<UP>) =>
          cacher.partialResource(id, params),
        remove: async (id: string) => cacher.removeResource(id),
      }),
      [cacher, params],
    );

    return useMemo(() => ({ response, api }), [response, api]);
  };

  const useSWRResource: UseRESTfulSWRResource<RT, CP, UP> = (id?: string) => {
    const client = useRestClient();
    const { mutate } = useSWRConfig();
    const cacher = useMemo(() => new ResourceCacher(client, adapter, mutate), [
      client,
      mutate,
    ]);

    const response = useSWR(id ? adapter.resourceKey(id) : null, {
      fetcher: useCallback(() => client.view(id!), [client, id]),
    });
    const api = useMemo(
      () => ({
        create: async (params: CP) => cacher.createResource(params),
        view: async () => {
          assertId(id);
          return cacher.viewResource(id);
        },
        update: async (params: UP) => {
          assertId(id);
          return cacher.updateResource(id, params);
        },
        partial: async (params: Partial<UP>) => {
          assertId(id);
          return cacher.partialResource(id, params);
        },
        remove: async () => {
          assertId(id);
          return cacher.removeResource(id);
        },
      }),
      [cacher, id],
    );

    return useMemo(() => ({ response, api }), [response, api]);
  };

  return { useSWRCollection, useSWRResource };
};
