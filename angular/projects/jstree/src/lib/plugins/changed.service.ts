import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { JsTreeNode } from '../jstree.models';

/** Describes a single change that occurred in the tree. */
export interface TreeChange {
  /** The type of operation that triggered the change. */
  action: 'select' | 'deselect' | 'open' | 'close' | 'create' | 'rename' | 'delete' | 'move' | 'copy';
  /** The node that was affected. */
  node: JsTreeNode;
  /** Timestamp of the change. */
  timestamp: number;
  /** Extra payload specific to the action. */
  extra?: unknown;
}

/**
 * ## ChangedService  (Strategy B – replaces `jstree.changed.js`)
 *
 * Tracks all mutations and selection changes in the native Angular tree
 * using RxJS Subjects.  Consumers subscribe to `change$` or the
 * action-specific streams to react to tree mutations.
 *
 * ### Usage
 * ```typescript
 * constructor(private changedService: ChangedService) {
 *   this.changedService.change$.subscribe(c => console.log(c));
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ChangedService implements OnDestroy {
  /** Emits every change event, regardless of action type. */
  readonly change$ = new Subject<TreeChange>();

  /** Emits only selection changes (select / deselect). */
  readonly selectionChange$ = new Subject<TreeChange>();

  /** Emits only structural changes (create / rename / delete / move / copy). */
  readonly structuralChange$ = new Subject<TreeChange>();

  /** Emits only open/close changes. */
  readonly visibilityChange$ = new Subject<TreeChange>();

  // ------------------------------------------------------------------
  // Recording helpers (called by NativeTreeService / NativeTreeComponent)
  // ------------------------------------------------------------------

  record(action: TreeChange['action'], node: JsTreeNode, extra?: unknown): void {
    const change: TreeChange = { action, node, extra, timestamp: Date.now() };
    this.change$.next(change);

    if (action === 'select' || action === 'deselect') {
      this.selectionChange$.next(change);
    } else if (action === 'open' || action === 'close') {
      this.visibilityChange$.next(change);
    } else {
      this.structuralChange$.next(change);
    }
  }

  ngOnDestroy(): void {
    this.change$.complete();
    this.selectionChange$.complete();
    this.structuralChange$.complete();
    this.visibilityChange$.complete();
  }
}
