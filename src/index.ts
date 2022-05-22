/**
 * A tool for managing an SWR cache for a REST collection and its associated
 * resources.
 *
 * ## Installing & Using
 *
 * ```sh
 * # npm
 * npm i create-restful-swr
 * # or yarn
 * yarn add create-result-swr
 * ```
 *
 * Once installed in your app, create a new RESTful SWR hook. The simplest
 * version looks like this:
 *
 * ```js
 * import { createRESTfulSWR, DefaultRestAdapter } from 'create-restful-swr';
 *
 * const {
 *   useSWRResource: useModel,
 *   useSWRCollection: useModels,
 * } = createRESTfulSWR({
 *   adapter: new DefaultRestAdapter('/models', 'id'),
 *   useRestClient: createDefaultUseRestClient('/models'),
 * });
 * ```
 *
 * This assumes a few things about your REST models:
 *
 * - `/models` returns an array of resources
 * - `/models/:id` returns a single resource
 * - Each resource has a unique `id` property that identifies the resource
 *
 * The `adapter` & `useRestClient` can be configured to work with your specific
 * REST API structure.
 *
 * ## Customizing
 *
 * There are two required parameters to pass to `createRESTfulSWR`, each of
 * which customizes the behavior of the hook.
 *
 * ### Customizing `adapter`
 *
 * The `adapter` is responsible for providing a consistent interface for
 * interacting with the collection & resources. You can use the
 * {@link DefaultRestAdapter | `DefaultRestAdapter`} if your customization
 * requirements are minimal. The first param is the key prefix to use when
 * caching the collection & resource. The second param is the primary key
 * on the resource.
 *
 * The `DefaultRestAdapter` assumes that the collection is a simple array of
 * resources. If your collection type is more complicated, you may need to
 * implement your own adapter. See {@link ResourceAdapter | `ResourceAdapter`}
 * for more info.
 *
 * ### Customizing `useRestClient`
 *
 * Similar to `adapter`, `useRestClient` is a hook for providing the underlying
 * REST client. It's called in hook position so you can access any necessary
 * Context or use other hooks to bootstrap the rest client.
 *
 * {@link createDefaultUseRestClient | `createDefaultUseRestClient`} will create
 * a default rest client hook which will use a thin, standard implementation of
 * a REST client. If your REST API is more complicated than the standard
 * implementation, you can create your own hook to return the rest client.
 * See {@link RestClient | `RestClient`} for more info.
 *
 * @packageDocumentation
 */

export * from './adapter';
export * from './client';
export * from './createRESTfulSWR';
export * from './types';
