import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { JsTreeNode } from '../jstree.models';

/** Configuration for a mass-load request. */
export interface MassLoadConfig {
  /** URL endpoint that accepts a list of node IDs and returns their children. */
  url: string;
  /** HTTP method. Default: 'POST'. */
  method?: 'GET' | 'POST';
  /** Additional headers. */
  headers?: Record<string, string>;
  /**
   * Transform the raw server response into the expected
   * `Record<nodeId, JsTreeNode[]>` shape.
   */
  responseTransform?: (raw: unknown) => Record<string, JsTreeNode[]>;
}

/**
 * ## MassLoadService  (Strategy B – replaces `jstree.massload.js`)
 *
 * Loads children for many nodes in a single HTTP request instead of
 * issuing one request per node.  Returns an `Observable` so consumers
 * can integrate with Angular's async pipeline.
 *
 * ### Usage
 * ```typescript
 * this.massLoadService
 *   .load(['node_1', 'node_2', 'node_3'], { url: '/api/tree/children' })
 *   .subscribe(map => applyChildren(map));
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MassLoadService {
  /**
   * Fetch children for the given node IDs in a single HTTP call.
   *
   * @param nodeIds IDs of the nodes whose children should be loaded.
   * @param config  Endpoint configuration.
   * @returns Observable that emits a map of `nodeId → children[]`.
   */
  load(
    nodeIds: string[],
    config: MassLoadConfig
  ): Observable<Record<string, JsTreeNode[]>> {
    if (!nodeIds.length) {
      return of({});
    }

    const method = config.method ?? 'POST';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    const requestInit: RequestInit = {
      method,
      headers,
      body: method === 'POST' ? JSON.stringify({ ids: nodeIds }) : undefined,
    };

    const url =
      method === 'GET'
        ? `${config.url}?ids=${nodeIds.join(',')}`
        : config.url;

    return from(
      fetch(url, requestInit).then((res) => {
        if (!res.ok) {
          throw new Error(`MassLoad request failed: ${res.status} ${res.statusText}`);
        }
        return res.json() as Promise<unknown>;
      })
    ).pipe(
      map((raw) =>
        config.responseTransform
          ? config.responseTransform(raw)
          : (raw as Record<string, JsTreeNode[]>)
      ),
      catchError((err: unknown) => {
        console.error('[MassLoadService] Error loading nodes:', err);
        return of({} as Record<string, JsTreeNode[]>);
      })
    );
  }

  /**
   * Convenience method that loads children synchronously from a pre-built map.
   * Useful in tests or when data is already available client-side.
   */
  loadFromMap(
    nodeIds: string[],
    dataMap: Record<string, JsTreeNode[]>
  ): Observable<Record<string, JsTreeNode[]>> {
    const result: Record<string, JsTreeNode[]> = {};
    for (const id of nodeIds) {
      if (dataMap[id]) {
        result[id] = dataMap[id];
      }
    }
    return of(result);
  }
}
