import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { JsTreeNode } from '../jstree.models';

/**
 * ## NativeTreeService  (Strategy B)
 *
 * Manages the state of a `NativeTreeComponent` instance.  Each
 * `NativeTreeComponent` creates its own instance of this service via the
 * component's `providers` array, so there is no global singleton conflict
 * when multiple trees exist on the same page.
 */
@Injectable()
export class NativeTreeService {
  private readonly _nodes$ = new BehaviorSubject<JsTreeNode[]>([]);
  private readonly _selected$ = new BehaviorSubject<Set<string>>(new Set());

  /** Observable stream of root nodes. */
  readonly nodes$: Observable<JsTreeNode[]> = this._nodes$.asObservable();

  /** Observable stream of selected node IDs. */
  readonly selected$: Observable<Set<string>> = this._selected$.asObservable();

  // ------------------------------------------------------------------
  // Node management
  // ------------------------------------------------------------------

  /** Replace the entire node tree. */
  setNodes(nodes: JsTreeNode[]): void {
    this._nodes$.next(nodes);
  }

  /** Returns the current root nodes. */
  getNodes(): JsTreeNode[] {
    return this._nodes$.getValue();
  }

  /**
   * Find a node by ID using a depth-first search.
   * Returns `null` if not found.
   */
  findNode(id: string, nodes?: JsTreeNode[]): JsTreeNode | null {
    const list = nodes ?? this._nodes$.getValue();
    for (const node of list) {
      if (node.id === id) {
        return node;
      }
      if (Array.isArray(node.children)) {
        const found = this.findNode(id, node.children as JsTreeNode[]);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * Add a child node under `parentId`.
   * Pass `'#'` (the root sentinel) to add at the root level.
   */
  addNode(parentId: string, node: JsTreeNode): void {
    const nodes = structuredClone(this._nodes$.getValue());
    if (parentId === '#') {
      nodes.push(node);
    } else {
      const parent = this.findNode(parentId, nodes);
      if (parent) {
        if (!Array.isArray(parent.children)) {
          parent.children = [];
        }
        (parent.children as JsTreeNode[]).push(node);
      }
    }
    this._nodes$.next(nodes);
  }

  /** Rename a node by ID. */
  renameNode(id: string, text: string): void {
    const nodes = structuredClone(this._nodes$.getValue());
    const node = this.findNode(id, nodes);
    if (node) {
      node.text = text;
      this._nodes$.next(nodes);
    }
  }

  /** Remove a node by ID (and all its children). */
  removeNode(id: string): void {
    const nodes = this._removeById(id, structuredClone(this._nodes$.getValue()));
    this._nodes$.next(nodes);
  }

  // ------------------------------------------------------------------
  // Selection management
  // ------------------------------------------------------------------

  /** Returns the current selected node ID set. */
  getSelected(): Set<string> {
    return this._selected$.getValue();
  }

  /** Replace the full selected set. */
  setSelected(ids: Set<string>): void {
    this._selected$.next(new Set(ids));
  }

  /** Select a node by ID (clears other selections unless `multi` is true). */
  selectNode(id: string, multi = false): void {
    const prev = this._selected$.getValue();
    const next = multi ? new Set(prev) : new Set<string>();
    next.add(id);
    this._selected$.next(next);
  }

  /** Deselect a node by ID. */
  deselectNode(id: string): void {
    const next = new Set(this._selected$.getValue());
    next.delete(id);
    this._selected$.next(next);
  }

  /** Deselect all nodes. */
  deselectAll(): void {
    this._selected$.next(new Set());
  }

  /**
   * Update the children of a node by ID and mark it as loaded.
   * Designed for lazy-load: after fetching children from a server, call this
   * to replace the sentinel `children: true` with the actual array.
   */
  updateNodeChildren(nodeId: string, children: JsTreeNode[]): void {
    const nodes = structuredClone(this._nodes$.getValue());
    const node = this.findNode(nodeId, nodes);
    if (node) {
      node.children = children;
      node.state = { ...node.state, loaded: true };
      this._nodes$.next(nodes);
    }
  }

  /**
   * Move a node to a new parent at a given position.
   * Pass `'#'` as `newParentId` to move to the root level.
   * Silently no-ops if the source node is not found.
   */
  moveNode(nodeId: string, newParentId: string, position: number): void {
    const nodes = structuredClone(this._nodes$.getValue());
    const node = this.findNode(nodeId, nodes);
    if (!node) {
      return;
    }
    const cloned = structuredClone(node);
    const pruned = this._removeById(nodeId, nodes);

    if (newParentId === '#') {
      const clampedPos = Math.min(position, pruned.length);
      pruned.splice(clampedPos, 0, cloned);
    } else {
      const parent = this.findNode(newParentId, pruned);
      if (parent) {
        if (!Array.isArray(parent.children)) {
          parent.children = [];
        }
        const siblings = parent.children as JsTreeNode[];
        const clampedPos = Math.min(position, siblings.length);
        siblings.splice(clampedPos, 0, cloned);
      }
    }
    this._nodes$.next(pruned);
  }

  // ------------------------------------------------------------------
  // Private helpers
  // ------------------------------------------------------------------

  private _removeById(id: string, nodes: JsTreeNode[]): JsTreeNode[] {
    return nodes
      .filter((n) => n.id !== id)
      .map((n) => {
        if (Array.isArray(n.children)) {
          return {
            ...n,
            children: this._removeById(id, n.children as JsTreeNode[]),
          };
        }
        return n;
      });
  }
}
