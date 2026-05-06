import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { JsTreeNode } from '../jstree.models';

/** Checkbox state for a single node. */
export type CheckState = 'checked' | 'unchecked' | 'indeterminate';

/**
 * ## CheckboxDirective  (Strategy B – replaces `jstree.checkbox.js`)
 *
 * Adds tri-state checkbox behaviour to the native Angular tree.
 * Attach this directive to the `<jstree-native-tree>` element.
 *
 * The directive maintains a map of node IDs to their check states and
 * propagates changes up (to parent nodes) and optionally down (to
 * children).
 *
 * ### Usage
 * ```html
 * <jstree-native-tree
 *   jsTreeCheckbox
 *   [checkedIds]="checkedSet"
 *   [threeState]="true"
 *   (checkChange)="onCheckChange($event)"
 * ></jstree-native-tree>
 * ```
 */
@Directive({ selector: '[jsTreeCheckbox]', standalone: false })
export class CheckboxDirective implements OnChanges {
  /** Initially checked node IDs. */
  @Input() checkedIds: Set<string> = new Set();

  /** Enable tri-state (indeterminate) behaviour. Default: true. */
  @Input() threeState = true;

  /** Cascade check state to children. Default: true. */
  @Input() cascadeDown = true;

  /** Cascade check state to parents (indeterminate). Default: true. */
  @Input() cascadeUp = true;

  /** The full node tree (needed for cascading logic). */
  @Input() nodes: JsTreeNode[] = [];

  /** Emits a map of `nodeId → CheckState` on every change. */
  @Output() checkChange = new EventEmitter<Map<string, CheckState>>();

  /** Internal state map. */
  private _stateMap = new Map<string, CheckState>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['checkedIds'] || changes['nodes']) {
      this._rebuild();
    }
  }

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  /** Returns the current check state for a node ID. */
  getState(nodeId: string): CheckState {
    return this._stateMap.get(nodeId) ?? 'unchecked';
  }

  /** Toggle a node's check state and propagate. */
  toggle(node: JsTreeNode): void {
    const id = node.id ?? node.text;
    const current = this.getState(id);
    const next: CheckState =
      current === 'checked' ? 'unchecked' : 'checked';
    this._stateMap.set(id, next);

    if (this.cascadeDown && Array.isArray(node.children)) {
      this._propagateDown(node.children as JsTreeNode[], next);
    }
    if (this.cascadeUp && this.threeState) {
      this._propagateUp(this.nodes);
    }

    this.checkChange.emit(new Map(this._stateMap));
  }

  /** Returns all checked node IDs. */
  getChecked(): string[] {
    return [...this._stateMap.entries()]
      .filter(([, v]) => v === 'checked')
      .map(([k]) => k);
  }

  /** Returns all indeterminate node IDs. */
  getIndeterminate(): string[] {
    return [...this._stateMap.entries()]
      .filter(([, v]) => v === 'indeterminate')
      .map(([k]) => k);
  }

  // ------------------------------------------------------------------
  // Private helpers
  // ------------------------------------------------------------------

  private _rebuild(): void {
    this._stateMap.clear();
    for (const id of this.checkedIds) {
      this._stateMap.set(id, 'checked');
    }
    if (this.cascadeUp && this.threeState) {
      this._propagateUp(this.nodes);
    }
    this.checkChange.emit(new Map(this._stateMap));
  }

  private _propagateDown(nodes: JsTreeNode[], state: CheckState): void {
    for (const node of nodes) {
      const id = node.id ?? node.text;
      this._stateMap.set(id, state);
      if (Array.isArray(node.children)) {
        this._propagateDown(node.children as JsTreeNode[], state);
      }
    }
  }

  /** Recompute parent states bottom-up. Returns true if ALL children are checked. */
  private _propagateUp(nodes: JsTreeNode[]): 'checked' | 'unchecked' | 'mixed' {
    let allChecked = true;
    let anyChecked = false;

    for (const node of nodes) {
      const id = node.id ?? node.text;
      let childResult: 'checked' | 'unchecked' | 'mixed' | null = null;

      if (Array.isArray(node.children) && node.children.length) {
        childResult = this._propagateUp(node.children as JsTreeNode[]);
        if (childResult === 'checked') {
          this._stateMap.set(id, 'checked');
        } else if (childResult === 'mixed') {
          this._stateMap.set(id, 'indeterminate');
        } else {
          if (!this.checkedIds.has(id)) {
            this._stateMap.set(id, 'unchecked');
          }
        }
      }

      const nodeState = this._stateMap.get(id) ?? 'unchecked';
      if (nodeState !== 'unchecked') {
        anyChecked = true;
      }
      if (nodeState !== 'checked') {
        allChecked = false;
      }
    }

    if (allChecked) {
      return 'checked';
    }
    return anyChecked ? 'mixed' : 'unchecked';
  }

  @HostListener('checkboxToggle', ['$event'])
  onCheckboxToggle(event: CustomEvent<JsTreeNode>): void {
    this.toggle(event.detail);
  }
}
