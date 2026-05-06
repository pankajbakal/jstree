import { Injectable } from '@angular/core';
import { JsTreeNode } from '../jstree.models';

/**
 * ## UniqueService  (Strategy B – replaces `jstree.unique.js`)
 *
 * Validates that node text values are unique within the same parent.
 * Used to prevent duplicate sibling names before a create/rename operation.
 */
@Injectable({ providedIn: 'root' })
export class UniqueService {
  /**
   * Returns `true` when `text` is unique among `siblings`.
   *
   * @param text       The candidate node text.
   * @param siblings   All sibling nodes to check against.
   * @param excludeId  Optional: exclude a specific node ID from the check
   *                   (use when renaming an existing node).
   * @param caseSensitive  Default: false.
   */
  isUnique(
    text: string,
    siblings: JsTreeNode[],
    excludeId?: string,
    caseSensitive = false
  ): boolean {
    const normalise = (s: string) => (caseSensitive ? s : s.toLowerCase());
    const candidate = normalise(text);
    return !siblings.some(
      (n) => n.id !== excludeId && normalise(n.text) === candidate
    );
  }

  /**
   * Finds duplicate text values within a flat list of siblings.
   * Returns an array of texts that appear more than once.
   */
  findDuplicates(siblings: JsTreeNode[], caseSensitive = false): string[] {
    const seen = new Map<string, number>();
    const normalise = (s: string) => (caseSensitive ? s : s.toLowerCase());
    for (const n of siblings) {
      const key = normalise(n.text);
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    return [...seen.entries()]
      .filter(([, count]) => count > 1)
      .map(([text]) => text);
  }

  /**
   * Validate the entire tree recursively and return all nodes with
   * non-unique sibling text.
   */
  validateTree(nodes: JsTreeNode[], caseSensitive = false): JsTreeNode[] {
    const duplicates: JsTreeNode[] = [];
    this._check(nodes, duplicates, caseSensitive);
    return duplicates;
  }

  private _check(
    siblings: JsTreeNode[],
    out: JsTreeNode[],
    caseSensitive: boolean
  ): void {
    const normalise = (s: string) => (caseSensitive ? s : s.toLowerCase());
    const seen = new Map<string, boolean>();
    for (const n of siblings) {
      const key = normalise(n.text);
      if (seen.has(key)) {
        out.push(n);
      } else {
        seen.set(key, true);
      }
      if (Array.isArray(n.children) && n.children.length) {
        this._check(n.children as JsTreeNode[], out, caseSensitive);
      }
    }
  }
}
