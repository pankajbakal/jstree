import { Injectable } from '@angular/core';
import { JsTreeNode, JsTreeTypeDefinition } from '../jstree.models';

/**
 * ## TypesService  (Strategy B – replaces `jstree.types.js`)
 *
 * Manages a registry of node-type definitions and provides helpers to
 * validate nesting rules and resolve type-specific icons / attributes.
 *
 * ### Usage
 * ```typescript
 * typesService.register({
 *   folder: { icon: 'fa fa-folder', valid_children: ['file', 'folder'] },
 *   file:   { icon: 'fa fa-file',   valid_children: [] },
 * });
 *
 * const ok = typesService.canHaveChild('folder', 'file'); // true
 * const icon = typesService.getIcon('file');              // 'fa fa-file'
 * ```
 */
@Injectable({ providedIn: 'root' })
export class TypesService {
  private _types: Record<string, JsTreeTypeDefinition> = {
    default: {},
    '#': {},
  };

  /** Replace the entire type registry. */
  register(types: Record<string, JsTreeTypeDefinition>): void {
    // Apply 'default' properties as baseline for all other types
    const defaults = types['default'] ?? {};
    this._types = { default: defaults, '#': types['#'] ?? {} };
    for (const [key, def] of Object.entries(types)) {
      if (key === 'default' || key === '#') {
        continue;
      }
      this._types[key] = { ...defaults, ...def };
    }
  }

  /** Returns the definition for a type name, or `undefined`. */
  getType(name: string): JsTreeTypeDefinition | undefined {
    return this._types[name];
  }

  /** Returns all registered type names (excluding '#' and 'default'). */
  getTypeNames(): string[] {
    return Object.keys(this._types).filter(
      (k) => k !== '#' && k !== 'default'
    );
  }

  /** Resolve the icon for a node, falling back to the type's icon. */
  getIcon(node: JsTreeNode): string | boolean | undefined {
    if (node.icon !== undefined) {
      return node.icon;
    }
    const typeDef = node.type ? this._types[node.type] : undefined;
    return typeDef?.icon;
  }

  /**
   * Returns `true` if a node of type `childType` can be placed inside
   * a node of type `parentType`.
   */
  canHaveChild(parentType: string, childType: string): boolean {
    const def = this._types[parentType];
    if (!def) {
      return true; // unknown type – allow by default
    }
    const { valid_children } = def;
    if (valid_children === undefined || valid_children === -1) {
      return true;
    }
    if (Array.isArray(valid_children)) {
      return valid_children.includes(childType);
    }
    return false;
  }

  /**
   * Returns `true` if `parentType` can still accept children given the
   * current child count.
   */
  withinMaxChildren(parentType: string, currentCount: number): boolean {
    const def = this._types[parentType];
    if (!def || def.max_children === undefined || def.max_children === -1) {
      return true;
    }
    return currentCount < def.max_children;
  }

  /**
   * Returns `true` if adding a node at `depth` is within the `max_depth`
   * constraint of `parentType`.
   *
   * @param depth  The 1-based depth of the new node (root nodes are depth 1).
   */
  withinMaxDepth(parentType: string, depth: number): boolean {
    const def = this._types[parentType];
    if (!def || def.max_depth === undefined || def.max_depth === -1) {
      return true;
    }
    return depth <= def.max_depth;
  }

  /**
   * Resolve extra `<li>` attributes from a type definition merged with
   * any node-level `li_attr`.
   */
  getLiAttr(node: JsTreeNode): Record<string, string> {
    const typeDef = node.type ? this._types[node.type] : undefined;
    return { ...typeDef?.li_attr, ...node.li_attr };
  }

  /**
   * Resolve extra `<a>` attributes from a type definition merged with
   * any node-level `a_attr`.
   */
  getAAttr(node: JsTreeNode): Record<string, string> {
    const typeDef = node.type ? this._types[node.type] : undefined;
    return { ...typeDef?.a_attr, ...node.a_attr };
  }
}
