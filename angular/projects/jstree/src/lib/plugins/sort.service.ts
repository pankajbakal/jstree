import { Injectable } from '@angular/core';
import { JsTreeNode } from '../jstree.models';

/**
 * ## SortService  (Strategy B – replaces `jstree.sort.js`)
 *
 * Provides node-sorting utilities.  The default comparator sorts nodes
 * alphabetically by their `text` property, case-insensitively.
 *
 * ### Usage
 * ```typescript
 * const sorted = sortService.sort(nodes);
 * const custom = sortService.sort(nodes, (a, b) => a.id!.localeCompare(b.id!));
 * ```
 */
@Injectable({ providedIn: 'root' })
export class SortService {
  /**
   * Default comparator: case-insensitive alphabetical sort by `text`.
   * Mirrors the behaviour of the jQuery jstree `sort` plugin.
   */
  readonly defaultComparator = (a: JsTreeNode, b: JsTreeNode): number =>
    a.text.toLowerCase().localeCompare(b.text.toLowerCase());

  /**
   * Sort an array of nodes (non-mutating).
   * Optionally recurse into children.
   *
   * @param nodes      The nodes to sort.
   * @param comparator Custom sort function; defaults to alphabetical.
   * @param recursive  Whether to sort child arrays as well. Default: true.
   */
  sort(
    nodes: JsTreeNode[],
    comparator: (a: JsTreeNode, b: JsTreeNode) => number = this.defaultComparator,
    recursive = true
  ): JsTreeNode[] {
    const sorted = [...nodes].sort(comparator);
    if (recursive) {
      return sorted.map((node) => ({
        ...node,
        children: Array.isArray(node.children)
          ? this.sort(node.children as JsTreeNode[], comparator, recursive)
          : node.children,
      }));
    }
    return sorted;
  }
}
