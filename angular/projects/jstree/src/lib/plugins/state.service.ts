import { Injectable, OnDestroy } from '@angular/core';
import { JsTreeNode } from '../jstree.models';

/** Persisted state shape. */
export interface TreeState {
  /** IDs of open nodes. */
  open: string[];
  /** IDs of selected nodes. */
  selected: string[];
  /** Optional: IDs of checked nodes (checkbox plugin). */
  checked?: string[];
  /** Unix ms timestamp when this state was saved. */
  savedAt: number;
}

/** Configuration for the StateService. */
export interface StateServiceConfig {
  /** localStorage key.  Defaults to 'jstree_state'. */
  key?: string;
  /** Time-to-live in milliseconds.  `null` = no expiry.  Default: null. */
  ttl?: number | null;
  /** Storage backend.  Defaults to `localStorage`. */
  storage?: Storage;
}

/**
 * ## StateService  (Strategy B – replaces `jstree.state.js`)
 *
 * Saves and restores the open/selected state of the native tree to/from
 * `localStorage` (or any `Storage`-compatible backend).
 *
 * ### Usage
 * ```typescript
 * // Save state after any selection or open/close change:
 * this.stateService.save(openIds, selectedIds);
 *
 * // Restore on init:
 * const state = this.stateService.load();
 * if (state) { applyState(state); }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class StateService implements OnDestroy {
  private _key: string;
  private _ttl: number | null;
  private _storage: Storage;

  constructor() {
    this._key = 'jstree_state';
    this._ttl = null;
    this._storage = typeof localStorage !== 'undefined' ? localStorage : ({} as Storage);
  }

  /** Configure the service (call once during app init or in a factory provider). */
  configure(config: StateServiceConfig): void {
    this._key = config.key ?? this._key;
    this._ttl = config.ttl ?? this._ttl;
    this._storage = config.storage ?? this._storage;
  }

  /**
   * Persist the current tree state.
   *
   * @param openIds     IDs of currently open nodes.
   * @param selectedIds IDs of currently selected nodes.
   * @param checkedIds  IDs of currently checked nodes (optional).
   */
  save(
    openIds: string[],
    selectedIds: string[],
    checkedIds?: string[]
  ): void {
    const state: TreeState = {
      open: openIds,
      selected: selectedIds,
      checked: checkedIds,
      savedAt: Date.now(),
    };
    try {
      this._storage.setItem(this._key, JSON.stringify(state));
    } catch (e) {
      console.warn('[StateService] Could not save state:', e);
    }
  }

  /**
   * Load the previously persisted state.
   * Returns `null` if no state is found or if the TTL has expired.
   */
  load(): TreeState | null {
    try {
      const raw = this._storage.getItem(this._key);
      if (!raw) {
        return null;
      }
      const state: TreeState = JSON.parse(raw) as TreeState;
      if (this._ttl !== null && Date.now() - state.savedAt > this._ttl) {
        this.clear();
        return null;
      }
      return state;
    } catch {
      return null;
    }
  }

  /** Apply a saved state to node arrays in-place. */
  applyToNodes(
    nodes: JsTreeNode[],
    state: TreeState
  ): JsTreeNode[] {
    const openSet = new Set(state.open);
    const selectedSet = new Set(state.selected);
    return this._apply(nodes, openSet, selectedSet);
  }

  /** Remove the persisted state from storage. */
  clear(): void {
    try {
      this._storage.removeItem(this._key);
    } catch {
      // ignore
    }
  }

  ngOnDestroy(): void {
    // nothing to clean up (storage is external)
  }

  // ------------------------------------------------------------------
  // Private helpers
  // ------------------------------------------------------------------

  private _apply(
    nodes: JsTreeNode[],
    openSet: Set<string>,
    selectedSet: Set<string>
  ): JsTreeNode[] {
    return nodes.map((n) => {
      const id = n.id ?? '';
      const updated: JsTreeNode = {
        ...n,
        state: {
          ...n.state,
          opened: openSet.has(id) ? true : n.state?.opened,
          selected: selectedSet.has(id) ? true : n.state?.selected,
        },
      };
      if (Array.isArray(n.children) && n.children.length) {
        updated.children = this._apply(
          n.children as JsTreeNode[],
          openSet,
          selectedSet
        );
      }
      return updated;
    });
  }
}
