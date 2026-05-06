import { Pipe, PipeTransform } from '@angular/core';
import { JsTreeNode } from '../jstree.models';

/** Options that control how the search is performed. */
export interface SearchPipeOptions {
  /** Case-sensitive matching.  Default: false. */
  caseSensitive?: boolean;
  /**
   * Fuzzy matching: 'abc' matches 'a_b_c', 'abc def', etc.
   * Default: false.
   */
  fuzzy?: boolean;
  /**
   * When `true`, only nodes whose text directly matches are returned
   * (ancestor nodes that only "contain" a match are excluded).
   * Default: false.
   */
  leavesOnly?: boolean;
}

/**
 * ## JstreeSearchPipe  (Strategy B – replaces `jstree.search.js`)
 *
 * Pure Angular pipe that filters a flat or hierarchical node array by a
 * search string, returning only matching nodes (and, by default, their
 * ancestors so the tree structure is preserved).
 *
 * The pipe is **pure** – Angular re-evaluates it only when the input
 * reference changes.  Use `| async` or an immutable update pattern to
 * trigger re-evaluation.
 *
 * ### Usage
 * ```html
 * <jstree-native-tree [nodes]="nodes | jsTreeSearch : searchStr"></jstree-native-tree>
 * ```
 */
@Pipe({ name: 'jsTreeSearch', pure: true, standalone: false })
export class JstreeSearchPipe implements PipeTransform {
  /**
   * @param nodes   Root node array (hierarchical).
   * @param query   Search string.  Pass empty / null to return all nodes.
   * @param options Search options.
   */
  transform(
    nodes: JsTreeNode[],
    query: string | null | undefined,
    options: SearchPipeOptions = {}
  ): JsTreeNode[] {
    if (!query || !query.trim()) {
      return nodes;
    }
    return this._filter(nodes, query.trim(), options);
  }

  // ------------------------------------------------------------------
  // Private
  // ------------------------------------------------------------------

  private _filter(
    nodes: JsTreeNode[],
    query: string,
    opts: SearchPipeOptions
  ): JsTreeNode[] {
    const result: JsTreeNode[] = [];
    for (const node of nodes) {
      const childMatches = Array.isArray(node.children) && node.children.length
        ? this._filter(node.children as JsTreeNode[], query, opts)
        : [];

      const selfMatch = this._matches(node.text, query, opts);

      if (selfMatch || (!opts.leavesOnly && childMatches.length > 0)) {
        result.push({
          ...node,
          children: childMatches.length ? childMatches : (selfMatch ? node.children : []),
          // Auto-open ancestor nodes so matched nodes are visible
          state: {
            ...node.state,
            opened: childMatches.length > 0 ? true : node.state?.opened,
          },
        });
      }
    }
    return result;
  }

  private _matches(text: string, query: string, opts: SearchPipeOptions): boolean {
    const normalise = (s: string) =>
      opts.caseSensitive ? s : s.toLowerCase();

    const t = normalise(text);
    const q = normalise(query);

    if (opts.fuzzy) {
      return this._fuzzyMatch(t, q);
    }
    return t.includes(q);
  }

  /**
   * Simple fuzzy match: every character in `query` must appear in `text`
   * in order (but not necessarily contiguously).
   */
  private _fuzzyMatch(text: string, query: string): boolean {
    let qi = 0;
    for (let ti = 0; ti < text.length && qi < query.length; ti++) {
      if (text[ti] === query[qi]) {
        qi++;
      }
    }
    return qi === query.length;
  }
}
