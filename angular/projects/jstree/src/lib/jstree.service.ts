import { ElementRef, Injectable } from '@angular/core';
import { JsTreeNode } from './jstree.models';

declare const $: any; // jQuery injected via global script

/**
 * ## JstreeService  (Strategy A)
 *
 * Provides programmatic access to any jstree instance in the application.
 * Inject this service alongside `JstreeComponent` when you need to call
 * instance methods imperatively (e.g. from a parent component or a router
 * resolver).
 *
 * ### Usage
 * ```typescript
 * @Component({ ... })
 * export class MyComponent {
 *   @ViewChild(JstreeComponent) tree!: JstreeComponent;
 *
 *   constructor(private readonly jstreeService: JstreeService) {}
 *
 *   addNode(): void {
 *     this.jstreeService.createNode(this.tree.hostElement, '#', { text: 'New Node' });
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class JstreeService {
  // ------------------------------------------------------------------
  // Instance access
  // ------------------------------------------------------------------

  /**
   * Returns the raw jstree instance attached to `el`.
   * Prefer using `JstreeComponent`'s public methods when possible.
   */
  getInstance(el: ElementRef | HTMLElement): unknown {
    return $(this._resolve(el)).jstree(true);
  }

  // ------------------------------------------------------------------
  // Node retrieval
  // ------------------------------------------------------------------

  /** Returns the node object for the given `nodeId`, or `false`. */
  getNode(el: ElementRef | HTMLElement, nodeId: string): JsTreeNode | false {
    return $(this._resolve(el)).jstree('get_node', nodeId);
  }

  /**
   * Returns the path of a node as an array of text labels.
   * Pass `true` for `ids` to get IDs instead.
   */
  getPath(
    el: ElementRef | HTMLElement,
    nodeId: string,
    glue?: string,
    ids = false
  ): string[] | string {
    return $(this._resolve(el)).jstree('get_path', nodeId, glue, ids);
  }

  /** Returns the IDs of all currently selected nodes. */
  getSelected(el: ElementRef | HTMLElement, full = false): string[] {
    return $(this._resolve(el)).jstree('get_selected', full);
  }

  /** Returns the IDs of all checked nodes (requires `checkbox` plugin). */
  getCheckedNodes(el: ElementRef | HTMLElement, full = false): string[] {
    return $(this._resolve(el)).jstree('get_checked', full);
  }

  /** Returns the IDs of all undetermined/indeterminate nodes. */
  getUndeterminedNodes(el: ElementRef | HTMLElement, full = false): string[] {
    return $(this._resolve(el)).jstree('get_undetermined', full);
  }

  // ------------------------------------------------------------------
  // Selection
  // ------------------------------------------------------------------

  /** Select a node by ID. */
  selectNode(
    el: ElementRef | HTMLElement,
    nodeId: string,
    suppressEvent = false
  ): void {
    $(this._resolve(el)).jstree('select_node', nodeId, suppressEvent);
  }

  /** Deselect a node by ID. */
  deselectNode(
    el: ElementRef | HTMLElement,
    nodeId: string,
    suppressEvent = false
  ): void {
    $(this._resolve(el)).jstree('deselect_node', nodeId, suppressEvent);
  }

  /** Deselect all nodes. */
  deselectAll(el: ElementRef | HTMLElement, suppressEvent = false): void {
    $(this._resolve(el)).jstree('deselect_all', suppressEvent);
  }

  /** Select all nodes. */
  selectAll(el: ElementRef | HTMLElement, suppressEvent = false): void {
    $(this._resolve(el)).jstree('select_all', suppressEvent);
  }

  // ------------------------------------------------------------------
  // Open / close
  // ------------------------------------------------------------------

  /** Open (expand) a node. */
  openNode(
    el: ElementRef | HTMLElement,
    nodeId: string,
    callback?: () => void
  ): void {
    $(this._resolve(el)).jstree('open_node', nodeId, callback);
  }

  /** Close (collapse) a node. */
  closeNode(
    el: ElementRef | HTMLElement,
    nodeId: string,
    callback?: () => void
  ): void {
    $(this._resolve(el)).jstree('close_node', nodeId, callback);
  }

  /** Toggle a node open or closed. */
  toggleNode(el: ElementRef | HTMLElement, nodeId: string): void {
    $(this._resolve(el)).jstree('toggle_node', nodeId);
  }

  /** Open all nodes (optionally under a specific parent). */
  openAll(
    el: ElementRef | HTMLElement,
    nodeId?: string,
    animation?: number
  ): void {
    $(this._resolve(el)).jstree('open_all', nodeId, animation);
  }

  /** Close all nodes (optionally under a specific parent). */
  closeAll(
    el: ElementRef | HTMLElement,
    nodeId?: string,
    animation?: number
  ): void {
    $(this._resolve(el)).jstree('close_all', nodeId, animation);
  }

  // ------------------------------------------------------------------
  // CRUD operations
  // ------------------------------------------------------------------

  /**
   * Create a new node.
   * @returns The new node's ID, or `false` on failure.
   */
  createNode(
    el: ElementRef | HTMLElement,
    parentId: string,
    node: Partial<JsTreeNode>,
    position: 'last' | 'first' | number = 'last',
    callback?: (node: JsTreeNode) => void
  ): string | false {
    return $(this._resolve(el)).jstree(
      'create_node',
      parentId,
      node,
      position,
      callback
    );
  }

  /** Rename a node. */
  renameNode(
    el: ElementRef | HTMLElement,
    nodeId: string,
    text: string
  ): void {
    $(this._resolve(el)).jstree('rename_node', nodeId, text);
  }

  /** Delete a node by ID (and all its children). */
  deleteNode(el: ElementRef | HTMLElement, nodeId: string): void {
    $(this._resolve(el)).jstree('delete_node', nodeId);
  }

  /**
   * Move a node to a new parent.
   * @param position - insertion position: 'first', 'last', or a zero-based index.
   */
  moveNode(
    el: ElementRef | HTMLElement,
    nodeId: string,
    parentId: string,
    position: 'first' | 'last' | number = 'last'
  ): void {
    $(this._resolve(el)).jstree('move_node', nodeId, parentId, position);
  }

  /**
   * Copy a node to a new parent.
   * @param position - insertion position: 'first', 'last', or a zero-based index.
   */
  copyNode(
    el: ElementRef | HTMLElement,
    nodeId: string,
    parentId: string,
    position: 'first' | 'last' | number = 'last'
  ): void {
    $(this._resolve(el)).jstree('copy_node', nodeId, parentId, position);
  }

  // ------------------------------------------------------------------
  // Refresh / load
  // ------------------------------------------------------------------

  /** Reload the tree (or a specific node). */
  refresh(
    el: ElementRef | HTMLElement,
    skipLoading = false,
    forgetState = false
  ): void {
    $(this._resolve(el)).jstree('refresh', skipLoading, forgetState);
  }

  /** Reload a specific node's children. */
  refreshNode(el: ElementRef | HTMLElement, nodeId: string): void {
    $(this._resolve(el)).jstree('refresh_node', nodeId);
  }

  /** Load a specific node's children (triggers AJAX if data is lazy). */
  loadNode(el: ElementRef | HTMLElement, nodeId: string): void {
    $(this._resolve(el)).jstree('load_node', nodeId, () => {});
  }

  // ------------------------------------------------------------------
  // Search (requires `search` plugin)
  // ------------------------------------------------------------------

  /** Perform a search. */
  search(el: ElementRef | HTMLElement, str: string): void {
    $(this._resolve(el)).jstree('search', str);
  }

  /** Clear search results. */
  clearSearch(el: ElementRef | HTMLElement): void {
    $(this._resolve(el)).jstree('clear_search');
  }

  // ------------------------------------------------------------------
  // Checkbox (requires `checkbox` plugin)
  // ------------------------------------------------------------------

  /** Show all checkboxes. */
  showCheckboxes(el: ElementRef | HTMLElement): void {
    $(this._resolve(el)).jstree('show_checkboxes');
  }

  /** Hide all checkboxes. */
  hideCheckboxes(el: ElementRef | HTMLElement): void {
    $(this._resolve(el)).jstree('hide_checkboxes');
  }

  /** Toggle all checkboxes visibility. */
  toggleCheckboxes(el: ElementRef | HTMLElement): void {
    $(this._resolve(el)).jstree('toggle_checkboxes');
  }

  // ------------------------------------------------------------------
  // Utility
  // ------------------------------------------------------------------

  /** Returns `true` if the element has an active jstree instance. */
  isAttached(el: ElementRef | HTMLElement): boolean {
    try {
      return !!($(this._resolve(el)).jstree(true) as unknown);
    } catch {
      return false;
    }
  }

  // ------------------------------------------------------------------
  // Private helpers
  // ------------------------------------------------------------------

  private _resolve(el: ElementRef | HTMLElement): HTMLElement {
    return el instanceof ElementRef ? el.nativeElement : el;
  }
}
