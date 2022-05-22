import React from 'react';
import { act, renderHook as rtlRenderHook } from '@testing-library/react-hooks';
import { SWRConfig, Cache, unstable_serialize, Key } from 'swr';
import {
  createRESTfulSWR,
  defaultFilter,
  DefaultRestAdapter,
  defaultUpsert,
  ResourceAdapter,
  RestClient,
} from '../src';

type BaseRestClient = RestClient<unknown, unknown, unknown, unknown, unknown>;
type MockRestClient = BaseRestClient &
  {
    [K in keyof BaseRestClient]: jest.Mock;
  };

type TestSuite = {
  createRestClient(): any;
  createAdapter(): any;
  createConfig?(): any;
  createListResponseWithItem(item?: any): any;
  createEmptyListResponse(): any;
  createListParams(): any;
  createCreateResourceParams(): any;
  createResource(): any;
  createViewResponse(): any;
  createUpdatedViewResponse(): any;
};

process.on('unhandledRejection', error => {
  console.log(error);
});

const createTestSuite = ({
  createRestClient,
  createAdapter,
  createConfig = () => ({}),
  createListResponseWithItem,
  createEmptyListResponse,
  createListParams,
  createCreateResourceParams,
  createResource,
  createViewResponse,
  createUpdatedViewResponse,
}: TestSuite) => () => {
  let restClient: MockRestClient;
  const adapter = createAdapter();
  const { useSWRCollection, useSWRResource } = createRESTfulSWR({
    useRestClient: () => restClient,
    adapter,
    ...createConfig(),
  });

  let cache: Cache;
  const renderHook = <TProps, TResult>(callback: (props: TProps) => TResult) =>
    rtlRenderHook(callback, {
      wrapper: ({ children }) => (
        <SWRConfig value={{ provider: () => cache }}>{children}</SWRConfig>
      ),
    });

  beforeEach(() => {
    cache = new Map();
    restClient = createRestClient();
  });

  describe('useSWRCollection', () => {
    describe('response', () => {
      it('should return collection from client#list', async () => {
        const listResponse = createListResponseWithItem();
        restClient.list.mockResolvedValue(listResponse);

        const { result, waitFor } = renderHook(() => useSWRCollection());

        await waitFor(() => {
          expect(result.current.response.data).toBe(listResponse);
        });
        expect(restClient.list).toHaveBeenCalledTimes(1);
        expect(restClient.list).toHaveBeenCalledWith(undefined);
      });

      it('should call client#list with params', async () => {
        const listResponse = createListResponseWithItem();
        const params = createListParams();
        restClient.list.mockResolvedValue(listResponse);

        const { result, waitFor } = renderHook(() => useSWRCollection(params));

        await waitFor(() => {
          expect(result.current.response.data).toBe(listResponse);
        });
        expect(restClient.list).toHaveBeenCalledTimes(1);
        expect(restClient.list).toHaveBeenCalledWith(params);
      });

      it('should return error from client#list', async () => {
        const listError = new Error('Error from client#list');
        restClient.list.mockRejectedValue(listError);

        const { result, waitFor } = renderHook(() => useSWRCollection());

        await waitFor(() => {
          expect(result.current.response.error).toBe(listError);
        });
        expect(restClient.list).toHaveBeenCalledTimes(1);
      });
    });

    describe('api', () => {
      describe('list', () => {
        let initialListResponse: any;
        beforeEach(() => {
          initialListResponse = createEmptyListResponse();
          restClient.list.mockResolvedValueOnce(initialListResponse);
        });

        it('should load from client#list', async () => {
          const listResponse = createListResponseWithItem();
          restClient.list.mockResolvedValueOnce(listResponse);
          const { result, waitFor } = renderHook(() => useSWRCollection());

          await waitFor(() =>
            expect(result.current.response.data).toEqual(initialListResponse),
          );

          let response: unknown;
          await act(async () => {
            response = await result.current.api.list();
          });

          expect(response).toBe(listResponse);
          expect(restClient.list).toBeCalledTimes(2);
        });

        it('should push response to cache', async () => {
          const listResponse = createListResponseWithItem();
          restClient.list.mockResolvedValueOnce(listResponse);
          const { result, waitFor } = renderHook(() => useSWRCollection());

          await waitFor(() =>
            expect(result.current.response.data).toEqual(initialListResponse),
          );
          await act(async () => {
            await result.current.api.list();
          });

          expect(result.current.response.data).toBe(listResponse);
        });
      });

      describe('create', () => {
        const createParams = createCreateResourceParams();
        const createResponse = createResource();

        beforeEach(() => {
          restClient.list.mockResolvedValueOnce(createEmptyListResponse());
          restClient.create.mockResolvedValueOnce(createResponse);
        });

        it('should call client#create', async () => {
          const { result, waitFor } = renderHook(() => useSWRCollection());

          await waitFor(() =>
            expect(result.current.response.data).toEqual(
              createEmptyListResponse(),
            ),
          );

          let response: unknown;
          await act(async () => {
            response = await result.current.api.create(createParams);
          });

          expect(response).toBe(createResponse);
          expect(restClient.create).toBeCalledTimes(1);
          expect(restClient.create).toBeCalledWith(createParams);
        });

        it('should add created resource to cache', async () => {
          const { result, waitFor } = renderHook(() => useSWRCollection());

          await waitFor(() =>
            expect(result.current.response.data).toEqual(
              createEmptyListResponse(),
            ),
          );

          await act(async () => {
            await result.current.api.create(createParams);
          });

          const serializedKey = unstable_serialize(
            adapter.resourceKey(createResponse),
          );
          expect(cache.get(serializedKey)).toEqual(createResponse);
        });

        it('should add created resource to collection response', async () => {
          const { result, waitFor } = renderHook(() => useSWRCollection());

          await waitFor(() =>
            expect(result.current.response.data).toEqual(
              createEmptyListResponse(),
            ),
          );

          await act(async () => {
            await result.current.api.create(createParams);
          });

          expect(result.current.response.data).toEqual(
            createListResponseWithItem(createResponse),
          );
        });
      });

      describe('view', () => {
        const viewResponse = createViewResponse();

        beforeEach(() => {
          restClient.list.mockResolvedValueOnce(createEmptyListResponse());
          restClient.view.mockResolvedValueOnce(viewResponse);
        });

        it('should call client#view', async () => {
          const { result, waitFor } = renderHook(() => useSWRCollection());

          await waitFor(() =>
            expect(result.current.response.data).toEqual(
              createEmptyListResponse(),
            ),
          );

          let response: unknown;
          await act(async () => {
            response = await result.current.api.view('1');
          });

          expect(response).toEqual(viewResponse);
          expect(restClient.view).toHaveBeenCalledTimes(1);
          expect(restClient.view).toBeCalledWith('1');
        });

        it('should add viewed resource to cache', async () => {
          const { result, waitFor } = renderHook(() => useSWRCollection());

          await waitFor(() =>
            expect(result.current.response.data).toEqual(
              createEmptyListResponse(),
            ),
          );

          await act(async () => {
            await result.current.api.view('1');
          });

          const serializedKey = unstable_serialize(adapter.resourceKey('1'));
          expect(cache.get(serializedKey)).toEqual(viewResponse);
        });

        it('should add viewed resource to collection response', async () => {
          const { result, waitFor } = renderHook(() => useSWRCollection());

          await waitFor(() =>
            expect(result.current.response.data).toEqual(
              createEmptyListResponse(),
            ),
          );

          await act(async () => {
            await result.current.api.view('1');
          });

          expect(result.current.response.data).toEqual(
            createListResponseWithItem(),
          );
        });
      });

      describe('update', () => {
        const originalResource = createResource();
        const originalViewResponse = createListResponseWithItem(
          originalResource,
        );
        const updatedResource = createUpdatedViewResponse();
        const updatedViewResponse = createListResponseWithItem(updatedResource);

        beforeEach(() => {
          restClient.list.mockResolvedValueOnce(originalViewResponse);
          restClient.update.mockResolvedValueOnce(updatedResource);
        });

        it('should call client#update', async () => {
          const { result, waitFor } = renderHook(() => useSWRCollection());

          await waitFor(() =>
            expect(result.current.response.data).toEqual(originalViewResponse),
          );

          let response: unknown;
          await act(async () => {
            response = await result.current.api.update('1', { mock: false });
          });

          expect(response).toEqual(updatedResource);
          expect(restClient.update).toBeCalledTimes(1);
          expect(restClient.update).toBeCalledWith('1', { mock: false });
        });

        it('should add updated resource to cache', async () => {
          const { result, waitFor } = renderHook(() => useSWRCollection());

          await waitFor(() =>
            expect(result.current.response.data).toEqual(originalViewResponse),
          );

          await act(async () => {
            await result.current.api.update('1', { mock: false });
          });

          const serializedKey = unstable_serialize(adapter.resourceKey('1'));
          expect(cache.get(serializedKey)).toEqual(updatedResource);
        });

        it('should update resource in collection response', async () => {
          const { result, waitFor } = renderHook(() => useSWRCollection());

          await waitFor(() =>
            expect(result.current.response.data).toEqual(originalViewResponse),
          );

          await act(async () => {
            await result.current.api.update('1', { mock: false });
          });

          expect(result.current.response.data).toEqual(updatedViewResponse);
        });
      });

      describe('partial', () => {
        const originalResource = createResource();
        const originalViewResponse = createListResponseWithItem(
          originalResource,
        );
        const updatedResource = createUpdatedViewResponse();
        const updatedViewResponse = createListResponseWithItem(updatedResource);

        beforeEach(() => {
          restClient.list.mockResolvedValueOnce(originalViewResponse);
          restClient.partial.mockResolvedValueOnce(updatedResource);
        });

        it('should call client#partial', async () => {
          const { result, waitFor } = renderHook(() => useSWRCollection());

          await waitFor(() =>
            expect(result.current.response.data).toEqual(originalViewResponse),
          );

          let response: unknown;
          await act(async () => {
            response = await result.current.api.partial('1', { mock: false });
          });

          expect(response).toEqual(updatedResource);
          expect(restClient.partial).toBeCalledTimes(1);
          expect(restClient.partial).toBeCalledWith('1', { mock: false });
        });

        it('should add partially updated resource to cache', async () => {
          const { result, waitFor } = renderHook(() => useSWRCollection());

          await waitFor(() =>
            expect(result.current.response.data).toEqual(originalViewResponse),
          );

          await act(async () => {
            await result.current.api.partial('1', { mock: false });
          });

          const serializedKey = unstable_serialize(adapter.resourceKey('1'));
          expect(cache.get(serializedKey)).toEqual(updatedResource);
        });

        it('should update resource in collection response', async () => {
          const { result, waitFor } = renderHook(() => useSWRCollection());

          await waitFor(() =>
            expect(result.current.response.data).toEqual(originalViewResponse),
          );

          await act(async () => {
            await result.current.api.partial('1', { mock: false });
          });

          expect(result.current.response.data).toEqual(updatedViewResponse);
        });
      });

      describe('remove', () => {
        beforeEach(() => {
          restClient.list.mockResolvedValueOnce(createListResponseWithItem());
          restClient.remove.mockResolvedValueOnce(null);
        });

        it('should call client#remove', async () => {
          const { result, waitFor } = renderHook(() => useSWRCollection());

          await waitFor(() =>
            expect(result.current.response.data).toEqual(
              createListResponseWithItem(),
            ),
          );

          let response: unknown;
          await act(async () => {
            response = await result.current.api.remove('1');
          });

          expect(response).toBeNull();
          expect(restClient.remove).toBeCalledTimes(1);
          expect(restClient.remove).toBeCalledWith('1');
        });

        it('should remove resource from cache', async () => {
          const serializedKey = unstable_serialize(adapter.resourceKey('1'));
          const { result, waitFor } = renderHook(() => useSWRCollection());

          await waitFor(() =>
            expect(result.current.response.data).toEqual(
              createListResponseWithItem(),
            ),
          );

          await act(async () => {
            await result.current.api.remove('1');
          });

          expect(cache.get(serializedKey)).toBeNull();
        });

        it('should remove resource from collection response', async () => {
          const { result, waitFor } = renderHook(() => useSWRCollection());

          await waitFor(() =>
            expect(result.current.response.data).toEqual(
              createListResponseWithItem(),
            ),
          );

          await act(async () => {
            await result.current.api.remove('1');
          });

          expect(result.current.response.data).toEqual(
            createEmptyListResponse(),
          );
        });
      });
    });
  });

  describe('useSWRResource', () => {
    describe('response', () => {
      const viewResponse = createViewResponse();
      it('should return resource from client#view', async () => {
        restClient.view.mockResolvedValue(viewResponse);

        const { result, waitFor } = renderHook(() => useSWRResource('1'));

        await waitFor(() => {
          expect(result.current.response.data).toBe(viewResponse);
        });

        expect(restClient.view).toHaveBeenCalledTimes(1);
        expect(restClient.view).toHaveBeenCalledWith('1');
      });

      it('should return error from client#view', async () => {
        const viewError = new Error('error in client#view');
        restClient.view.mockRejectedValue(viewError);

        const { result, waitFor } = renderHook(() => useSWRResource('1'));

        await waitFor(() => {
          expect(result.current.response.error).toBe(viewError);
        });

        expect(restClient.view).toHaveBeenCalledTimes(1);
      });

      it('should not return response if no id provided', async () => {
        const { result, waitFor } = renderHook(() => useSWRResource());

        await waitFor(() =>
          expect(result.current.response.isValidating).toBe(false),
        );

        expect(restClient.view).not.toHaveBeenCalled();
      });
    });

    describe('api', () => {
      describe('create', () => {
        const createParams = createCreateResourceParams();
        const createResponse = createResource();

        beforeEach(() => {
          restClient.create.mockResolvedValueOnce(createResponse);
        });

        it('should call client#create', async () => {
          const { result, waitFor } = renderHook(() => useSWRResource());

          await waitFor(() =>
            expect(result.current.response.isValidating).toBe(false),
          );

          let response: unknown;
          await act(async () => {
            response = await result.current.api.create(createParams);
          });

          expect(response).toBe(createResponse);
          expect(restClient.create).toBeCalledTimes(1);
          expect(restClient.create).toBeCalledWith(createParams);
        });

        it('should add created resource to cache', async () => {
          const { result, waitFor } = renderHook(() => useSWRResource());

          await waitFor(() =>
            expect(result.current.response.isValidating).toBe(false),
          );

          await act(async () => {
            await result.current.api.create(createParams);
          });

          const serializedKey = unstable_serialize(
            adapter.resourceKey(createResponse),
          );
          expect(cache.get(serializedKey)).toEqual(createResponse);
        });
      });

      describe('view', () => {
        const viewResponse = createViewResponse();
        const updatedViewResponse = createUpdatedViewResponse();

        beforeEach(() => {
          restClient.view.mockResolvedValueOnce(viewResponse);
          restClient.view.mockResolvedValueOnce(updatedViewResponse);
        });

        it('should call client#view', async () => {
          const { result, waitFor } = renderHook(() => useSWRResource('1'));

          await waitFor(() =>
            expect(result.current.response.isValidating).toBe(false),
          );

          let response: unknown;
          await act(async () => {
            response = await result.current.api.view();
          });

          expect(response).toEqual(updatedViewResponse);
          expect(restClient.view).toHaveBeenCalledTimes(2);
          expect(restClient.view).toBeCalledWith('1');
        });

        it('should add viewed resource to response', async () => {
          const { result, waitFor } = renderHook(() => useSWRResource('1'));

          await waitFor(() =>
            expect(result.current.response.isValidating).toBe(false),
          );

          await act(async () => {
            await result.current.api.view();
          });

          expect(result.current.response.data).toEqual(updatedViewResponse);
        });

        it('should throw if no id is available', async () => {
          const { result, waitFor } = renderHook(() => useSWRResource());

          await waitFor(() =>
            expect(result.current.response.isValidating).toBe(false),
          );

          await expect(result.current.api.view()).rejects.toEqual(
            new Error('id is undefined'),
          );
        });
      });

      describe('update', () => {
        const originalResource = createViewResponse();
        const updatedResource = createUpdatedViewResponse();

        beforeEach(() => {
          restClient.view.mockResolvedValueOnce(originalResource);
          restClient.update.mockResolvedValueOnce(updatedResource);
        });

        it('should call client#update', async () => {
          const { result, waitFor } = renderHook(() => useSWRResource('1'));

          await waitFor(() =>
            expect(result.current.response.data).toEqual(originalResource),
          );

          let response: unknown;
          await act(async () => {
            response = await result.current.api.update({ mock: false });
          });

          expect(response).toEqual(updatedResource);
          expect(restClient.update).toBeCalledTimes(1);
          expect(restClient.update).toBeCalledWith('1', { mock: false });
        });

        it('should update resource in resource response', async () => {
          const { result, waitFor } = renderHook(() => useSWRResource('1'));

          await waitFor(() =>
            expect(result.current.response.data).toEqual(originalResource),
          );

          await act(async () => {
            await result.current.api.update({ mock: false });
          });

          expect(result.current.response.data).toEqual(updatedResource);
        });
      });

      describe('partial', () => {
        const originalResource = createViewResponse();
        const updatedResource = createUpdatedViewResponse();

        beforeEach(() => {
          restClient.view.mockResolvedValueOnce(originalResource);
          restClient.partial.mockResolvedValueOnce(updatedResource);
        });

        it('should call client#partial', async () => {
          const { result, waitFor } = renderHook(() => useSWRResource('1'));

          await waitFor(() =>
            expect(result.current.response.data).toEqual(originalResource),
          );

          let response: unknown;
          await act(async () => {
            response = await result.current.api.partial({ mock: false });
          });

          expect(response).toEqual(updatedResource);
          expect(restClient.partial).toBeCalledTimes(1);
          expect(restClient.partial).toBeCalledWith('1', { mock: false });
        });

        it('should update resource in resource response', async () => {
          const { result, waitFor } = renderHook(() => useSWRResource('1'));

          await waitFor(() =>
            expect(result.current.response.data).toEqual(originalResource),
          );
          await act(async () => {
            await result.current.api.partial({ mock: false });
          });

          expect(result.current.response.data).toEqual(updatedResource);
        });
      });

      describe('remove', () => {
        const resource = createViewResponse();

        beforeEach(() => {
          restClient.view.mockResolvedValueOnce(resource);
          restClient.remove.mockResolvedValueOnce(null);
        });

        it('should call client#remove', async () => {
          const { result, waitFor } = renderHook(() => useSWRResource('1'));

          await waitFor(() =>
            expect(result.current.response.data).toEqual(resource),
          );

          let response: unknown;
          await act(async () => {
            response = await result.current.api.remove();
          });

          expect(response).toBeNull();
          expect(restClient.remove).toBeCalledTimes(1);
          expect(restClient.remove).toBeCalledWith('1');
        });

        it('should remove resource from resource response', async () => {
          const { result, waitFor } = renderHook(() => useSWRResource('1'));

          await waitFor(() =>
            expect(result.current.response.data).toEqual(resource),
          );

          await act(async () => {
            await result.current.api.remove();
          });

          expect(result.current.response.data).toEqual(null);
        });
      });
    });
  });
};

describe('createRESTfulSWR', () => {
  describe(
    'basic example',
    createTestSuite({
      createRestClient: () => ({
        key: jest.fn(() => '/collection'),
        list: jest.fn(),
        create: jest.fn(),
        view: jest.fn(),
        update: jest.fn(),
        partial: jest.fn(),
        remove: jest.fn(),
      }),
      createAdapter: () => new DefaultRestAdapter('/collection', 'id'),
      createEmptyListResponse: () => [],
      createListResponseWithItem: (item = { id: '1', mock: true }) => [item],
      createListParams: () => ({ some: 'param' }),
      createCreateResourceParams: () => ({ mock: false }),
      createResource: () => ({ id: '1', mock: false }),
      createViewResponse: () => ({ id: '1', mock: true }),
      createUpdatedViewResponse: () => ({ id: '1', mock: false }),
    }),
  );

  describe(
    'adapter for custom resource id',
    createTestSuite({
      createRestClient: () => ({
        key: jest.fn(() => '/collection'),
        list: jest.fn(),
        create: jest.fn(),
        view: jest.fn(),
        update: jest.fn(),
        partial: jest.fn(),
        remove: jest.fn(),
      }),
      createAdapter: () => new DefaultRestAdapter('/collection', 'ID'),
      createEmptyListResponse: () => [],
      createListResponseWithItem: (item = { ID: '1', mock: true }) => [item],
      createListParams: () => ({ some: 'param' }),
      createCreateResourceParams: () => ({ mock: false }),
      createResource: () => ({ ID: '1', mock: false }),
      createViewResponse: () => ({ ID: '1', mock: true }),
      createUpdatedViewResponse: () => ({ ID: '1', mock: false }),
    }),
  );

  describe(
    'adapter for custom structure',
    createTestSuite({
      createRestClient: () => ({
        key: jest.fn(() => '/collection'),
        list: jest.fn(),
        create: jest.fn(),
        view: jest.fn(),
        update: jest.fn(),
        partial: jest.fn(),
        remove: jest.fn(),
      }),
      createAdapter: () =>
        new (class Adapter implements ResourceAdapter<any, any, any> {
          resourceKey(resource: any): Key {
            return [
              '/collection',
              typeof resource === 'string' ? resource : this.id(resource),
            ];
          }

          collectionKey(params?: any): Key {
            return ['/collection', params];
          }

          id(resource: any): string {
            return resource.ID;
          }

          all(collection: any): any[] {
            return collection.items;
          }

          upsert(resource: any, collection: any): any {
            const { result, inserted } = defaultUpsert(
              this,
              resource,
              collection.items,
            );

            return {
              items: result,
              page: collection.page,
              count: collection.count + Number(inserted),
            };
          }

          remove(id: string, collection: any): any {
            const { result, removed } = defaultFilter(
              this,
              id,
              collection.items,
            );

            return {
              items: result,
              page: collection.page,
              count: collection.count - Number(removed),
            };
          }
        })(),
      createEmptyListResponse: () => ({
        items: [],
        page: 1,
        count: 0,
      }),
      createListResponseWithItem: (item = { ID: '1', mock: true }) => ({
        items: [item],
        page: 1,
        count: 1,
      }),
      createListParams: () => ({ page: 1 }),
      createCreateResourceParams: () => ({ mock: false }),
      createResource: () => ({ ID: '1', mock: false }),
      createViewResponse: () => ({ ID: '1', mock: true }),
      createUpdatedViewResponse: () => ({ ID: '1', mock: false }),
    }),
  );
});
