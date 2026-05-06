import { Pipe, PipeTransform } from '@angular/core';
import { JsTreeNode } from '../jstree.models';

/**
 * A flattened representation of a single tree node, produced by `FlattenTreePipe`.
 * Designed for use with `CdkVirtualScrollViewport`.
 */
export interface FlatTreeNode {
  /** The original `JsTreeNode`. */
  node: JsTreeNode;
  /** Nesting depth (root nodes are 0). */
  depth: number;
  /** Whether this node has children. */
  hasChildren: boolean;
  /** Whether this node is currently expanded (its children are visible). */
  isOpen: boolean;
}

/**
 * ## FlattenTreePipe (`jsTreeFlatten`)
 *
 * Converts a hierarchical `JsTreeNode[]` tree into a flat `FlatTreeNode[]`
 * list suitable for `CdkVirtualScrollViewport` with a fixed row height.
 *
 * Only visible nodes (i.e. those whose parent is open) are included.
 *
 * ### Usage
 *
 * ```html
 * <cdk-virtual-scroll-viewport itemSize="24" style="height: 400px">
 *   <ng-container *cdkVirtualFor="let flat of nodes | jsTreeFlatten : openIds">
 *     <div [style.padding-left.px]="flat.depth * 16">
 *       <button *ngIf="flat.hasChildren" (click)="toggle(flat.node)">
 *         {{ flat.isOpen ? '▼' : '▶' }}
 *       </button>
 *       {{ flat.node.text }}
 *     </div>
 *   </ng-container>
 * </cdk-virtual-scroll-viewport>
 * ```
 *
 * `openIds` is a `Set<string>` managed by your component.  Create a **new**
 * Set on each toggle to trigger pure-pipe re-evaluation:
 *
 * ```typescript
 * openIds = new Set<string>();
 *
 * toggle(node: JsTreeNode) {
 *   const id = node.id ?? node.text;
 *   const next = new Set(this.openIds);
 *   next.has(id) ? next.delete(id) : next.add(id);
 *   this.openIds = next;
 * }
 * ```
 */
@Pipe({ name: 'jsTreeFlatten', pure: true, standalone: false })
export class FlattenTreePipe implements PipeTransform {
  transform(nodes: JsTreeNode[] | null | undefined, openIds: Set<string> = new Set()): FlatTreeNode[] {
    if (!nodes) {
      return [];
    }
    const result: FlatTreeNode[] = [];
    this._flatten(nodes, 0, openIds, result);
    return result;
  }

  private _flatten(
    nodes: JsTreeNode[],
    depth: number,
    openIds: Set<string>,
    result: FlatTreeNode[]
  ): void {
    for (const node of nodes) {
      const id = node.id ?? node.text;
      const hasChildren =
        (Array.isArray(node.children) && node.children.length > 0) ||
        node.children === true;
      const isOpen = openIds.has(id) || (node.state?.opened ?? false);

      result.push({ node, depth, hasChildren, isOpen });

      if (hasChildren && isOpen && Array.isArray(node.children)) {
        this._flatten(node.children as JsTreeNode[], depth + 1, openIds, result);
      }
    }
  }
}
