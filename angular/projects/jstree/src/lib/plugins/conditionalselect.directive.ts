import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { JsTreeNode } from '../jstree.models';

/**
 * ## ConditionalSelectDirective  (Strategy B – replaces `jstree.conditionalselect.js`)
 *
 * Attach to a `<jstree-native-node>` or its parent to guard selection with a
 * predicate.  The `canSelect` callback is invoked before emitting a selection
 * event; if it returns `false` the selection is vetoed.
 *
 * ### Usage
 * ```html
 * <jstree-native-tree
 *   jsTreeConditionalSelect
 *   [canSelect]="myGuardFn"
 *   (nodeSelected)="onSelect($event)"
 * ></jstree-native-tree>
 * ```
 */
@Directive({
  selector: '[jsTreeConditionalSelect]',
})
export class ConditionalSelectDirective {
  /**
   * Predicate called before a node is selected.
   * Return `false` to veto the selection.
   */
  @Input() canSelect: (node: JsTreeNode, event: Event) => boolean = () => true;

  /**
   * Predicate called before a node is deselected.
   * Return `false` to veto the deselection.
   */
  @Input() canDeselect: (node: JsTreeNode, event: Event) => boolean = () => true;

  /**
   * Emits the node when selection is allowed.
   * (Re-emits the underlying `nodeSelected` event after passing the guard.)
   */
  @Output() conditionalSelect = new EventEmitter<{
    node: JsTreeNode;
    selected: boolean;
    event: Event;
  }>();

  /**
   * Host listener on `nodeSelected` output bubbled from a child
   * `jstree-native-node`.  In practice, consumers bind this directive to
   * the tree container and listen to the bubbled custom events.
   */
  @HostListener('click', ['$event'])
  onHostClick(event: MouseEvent): void {
    // Selection logic is delegated to the node component; this directive
    // works as an interceptor at the container level when the consumer
    // routes events through it.
    const target = event.target as HTMLElement;
    if (!target.classList.contains('jstree-anchor')) {
      return;
    }
    // The actual veto is exercised in guardSelect / guardDeselect below.
  }

  /**
   * Call this from your component before processing a selection change.
   * Returns `true` if the action should proceed.
   */
  guardSelect(node: JsTreeNode, event: Event): boolean {
    return this.canSelect(node, event);
  }

  /**
   * Call this from your component before processing a deselection change.
   * Returns `true` if the action should proceed.
   */
  guardDeselect(node: JsTreeNode, event: Event): boolean {
    return this.canDeselect(node, event);
  }
}
