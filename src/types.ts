import { SWRResponse } from 'swr';
import { ResourceAdapter } from './adapter';
import { useRestClientHook } from './client';

/**
 * Parameters needed to create a new set of RESTful SWR hooks.
 *
 * @template RT Resource type.
 * @template CT Collection type.
 * @template LP List params.
 * @template CP Create params.
 * @template UP Update params.
 */
export type CreateRESTfulSWRParams<RT, CT, LP, CP, UP> = {
  /**
   * Adapter for this RESTful SWR hook.
   *
   * See {@link ResourceAdapter | ResourceAdapter}.
   */
  adapter: ResourceAdapter<LP, CT, RT>;

  /**
   * Rest client hook for this RESTful SWR hook.
   *
   * See {@link useRestClientHook | useRestClientHook}.
   */
  useRestClient: useRestClientHook<RT, CT, LP, CP, UP>;
};

/**
 * Result of RESTful SWR hook for managing a collection.
 *
 * @template RT Resource type.
 * @template CT Collection type.
 * @template LP List params.
 * @template CP Create params.
 * @template UP Update params.
 * @template E SWR error.
 */
export type RESTfulSWRCollection<RT, CT, LP, CP, UP, E = any> = {
  /**
   * SWR response.
   *
   * The is the result of calling `useSWR` for the collection.
   */
  response: SWRResponse<CT, E>;
  /**
   * API for interacting with the collection.
   *
   * See {@link RestClient | RestClient} for info about these methods.
   */
  api: {
    list(params?: LP): Promise<CT>;
    create(params: CP): Promise<RT>;
    view(id: string): Promise<RT>;
    update(id: string, params: UP): Promise<RT>;
    partial(id: string, params: Partial<UP>): Promise<RT>;
    remove(id: string): Promise<void>;
  };
};

/**
 * Hook for interacting with a collection.
 *
 * @template RT Resource type.
 * @template CT Collection type.
 * @template LP List params.
 * @template CP Create params.
 * @template UP Update params.
 * @template E SWR error.
 */
export type UseRESTfulSWRCollection<RT, CT, LP, CP, UP, E = any> = (
  params?: LP,
) => RESTfulSWRCollection<RT, CT, LP, CP, UP, E>;

/**
 * Result of RESTful SWR hook for managing a resource.
 *
 * @template RT Resource type.
 * @template CP Create params.
 * @template UP Update params.
 * @template E SWR error.
 */
export type RESTfulSWRResource<RT, CP, UP, E = any> = {
  /**
   * SWR response.
   *
   * The is the result of calling `useSWR` for the resource.
   */
  response: SWRResponse<RT, E>;
  /**
   * API for interacting with the resource.
   *
   * See {@link RestClient | RestClient} for info about these methods.
   */
  api: {
    create(params: CP): Promise<RT>;
    view(): Promise<RT>;
    update(params: UP): Promise<RT>;
    partial(params: Partial<UP>): Promise<RT>;
    remove(): Promise<void>;
  };
};

/**
 * Hook for interacting with a resource.
 *
 * @template RT Resource type.
 * @template CP Create params.
 * @template UP Update params.
 * @template E SWR error.
 */
export type UseRESTfulSWRResource<RT, CP, UP, E = any> = (
  id?: string,
) => RESTfulSWRResource<RT, CP, UP, E>;

/**
 * Hooks created by {@link createRESTfulSWR | createRESTfulSWR}.
 *
 * @template RT Resource type.
 * @template CT Collection type.
 * @template LP List params.
 * @template CP Create params.
 * @template UP Update params.
 * @template E SWR error.
 */
export type RESTfulSWR<RT, CT, LP, CP, UP, E = any> = {
  useSWRCollection: UseRESTfulSWRCollection<RT, CT, LP, CP, UP, E>;
  useSWRResource: UseRESTfulSWRResource<RT, CP, UP, E>;
};
