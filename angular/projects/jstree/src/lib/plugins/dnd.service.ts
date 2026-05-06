import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { JsTreeNode } from '../jstree.models';

/** Possible DnD operation types. */
export type DndOperation = 'move' | 'copy';

/** Information about an active drag. */
export interface DragState {
  /** Nodes currently being dragged. */
  nodes: JsTreeNode[];
  /** Whether a copy (vs. move) is in progress. */
  isCopy: boolean;
  /** The source tree instance identifier. */
  sourceId: string;
}

/** Payload emitted when a drop is accepted. */
export interface DropResult {
  /** Moved / copied nodes. */
  nodes: JsTreeNode[];
  /** ID of the new parent node. */
  newParentId: string;
  /** Insertion position in the new parent's children. */
  newPosition: number;
  /** Original parent ID. */
  oldParentId: string;
  /** Operation type. */
  operation: DndOperation;
  /** Source tree instance ID. */
  sourceId: string;
  /** Target tree instance ID. */
  targetId: string;
}

/**
 * ## DndService  (Strategy B – replaces `jstree.dnd.js`)
 *
 * Provides a coordinate point between drag sources and drop targets.
 * This service is deliberately framework-agnostic at the data level –
 * the actual HTML5 drag/drop wiring (or Angular CDK DragDrop) is done
 * by the consuming component.  This service manages shared drag state and
 * communicates drop results via RxJS streams.
 *
 * ### Integration with Angular CDK
 * For production use, pair this service with `@angular/cdk/drag-drop`:
 * ```typescript
 * // In your tree component template:
 * cdkDropList [cdkDropListData]="nodes" (cdkDropListDropped)="onDrop($event)"
 * ```
 * Then call `dndService.notifyDrop(result)` from the `(cdkDropListDropped)` handler.
 *
 * ### Basic HTML5 drag/drop usage
 * ```typescript
 * // dragstart
 * dndService.startDrag([node], 'move', 'tree-1');
 * // dragend / drop
 * dndService.notifyDrop({ nodes, newParentId, ... });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class DndService implements OnDestroy {
  private readonly _dragState$ = new BehaviorSubject<DragState | null>(null);
  private readonly _drop$ = new Subject<DropResult>();

  /** Emits the current drag state (null when no drag is in progress). */
  readonly dragState$: Observable<DragState | null> =
    this._dragState$.asObservable();

  /** Emits every time a drop is successfully completed. */
  readonly drop$: Observable<DropResult> = this._drop$.asObservable();

  // ------------------------------------------------------------------
  // Drag lifecycle
  // ------------------------------------------------------------------

  /**
   * Called when a drag operation begins.
   *
   * @param nodes    Nodes being dragged.
   * @param operation 'move' or 'copy'.
   * @param sourceId Identifier for the source tree instance.
   */
  startDrag(nodes: JsTreeNode[], operation: DndOperation, sourceId: string): void {
    this._dragState$.next({ nodes, isCopy: operation === 'copy', sourceId });
  }

  /** Called when a drag ends without a valid drop target. */
  cancelDrag(): void {
    this._dragState$.next(null);
  }

  /** Returns the currently active drag state, or `null`. */
  getDragState(): DragState | null {
    return this._dragState$.getValue();
  }

  // ------------------------------------------------------------------
  // Drop
  // ------------------------------------------------------------------

  /**
   * Notify the service that a drop has occurred and broadcast it to all
   * subscribers of `drop$`.
   */
  notifyDrop(result: DropResult): void {
    this._dragState$.next(null);
    this._drop$.next(result);
  }

  /**
   * Validate whether dropping `dragState.nodes` onto `targetParentId` is
   * allowed.  Override this method in a sub-class to implement custom rules.
   *
   * Default implementation: always allows, but returns `false` when the
   * target parent is one of the dragged nodes themselves.
   */
  canDrop(
    dragState: DragState,
    targetParentId: string,
    _targetTreeId: string
  ): boolean {
    return !dragState.nodes.some((n) => n.id === targetParentId);
  }

  ngOnDestroy(): void {
    this._dragState$.complete();
    this._drop$.complete();
  }
}
