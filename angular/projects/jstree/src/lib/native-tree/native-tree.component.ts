import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TrackByFunction,
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { JsTreeNode } from '../jstree.models';
import { NativeTreeService } from './native-tree.service';
import { DropResult } from '../plugins/dnd.service';

/**
 * ## NativeTreeComponent  (Strategy B – no jQuery)
 *
 * A fully native Angular tree component.  No jQuery or jstree dependency.
 *
 * ### Usage
 * ```html
 * <jstree-native-tree
 *   [nodes]="treeData"
 *   [multiSelect]="true"
 *   (nodeSelected)="onSelect($event)"
 *   (nodeToggled)="onToggle($event)"
 * ></jstree-native-tree>
 * ```
 */
@Component({
  selector: 'jstree-native-tree',
  template: `
    <div cdkDropListGroup *ngIf="nodes?.length">
      <ul
        role="tree"
        class="jstree-container-ul jstree-children"
        cdkDropList
        [cdkDropListData]="'#'"
        [cdkDropListDisabled]="!dndEnabled"
        (cdkDropListDropped)="onDrop($event)"
      >
        <jstree-native-node
          *ngFor="let node of nodes; trackBy: trackById"
          [node]="node"
          [multiSelect]="multiSelect"
          [selectedIds]="selectedIds"
          [disabledIds]="disabledIds"
          [renamingId]="renamingId"
          [loadingId]="loadingId"
          [dndEnabled]="dndEnabled"
          (nodeSelected)="onNodeSelected($event)"
          (nodeToggled)="onNodeToggled($event)"
          (nodeContextMenu)="onNodeContextMenu($event)"
          (nodeDblClick)="onNodeDblClick($event)"
          (loadChildrenRequest)="onLoadChildrenRequest($event)"
          (nodeRenamed)="onNodeRenamed($event)"
          (dropNode)="onDrop($event)"
        ></jstree-native-node>
      </ul>
    </div>
    <div *ngIf="!nodes?.length" class="jstree-no-data">No data.</div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .jstree-no-data {
      padding: 4px 8px;
      color: #888;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [NativeTreeService],
  standalone: false,
})
export class NativeTreeComponent implements OnInit, OnChanges, OnDestroy {
  /** Flat or hierarchical array of nodes. */
  @Input() nodes: JsTreeNode[] = [];

  /** Allow selecting multiple nodes (Ctrl/Meta+click). Default: false. */
  @Input() multiSelect = false;

  /** Pre-selected node IDs. */
  @Input() selectedIds: Set<string> = new Set();

  /** Pre-disabled node IDs. */
  @Input() disabledIds: Set<string> = new Set();

  /**
   * Lazy-load callback. Invoked when a node with `children: true` is first
   * expanded. Must return an `Observable` that resolves to the node's children.
   *
   * ```typescript
   * loadChildren = (node: JsTreeNode) =>
   *   this.http.get<JsTreeNode[]>(`/api/nodes/${node.id}/children`);
   * ```
   */
  @Input() loadChildren: ((node: JsTreeNode) => Observable<JsTreeNode[]>) | null = null;

  /** Enable CDK drag-and-drop reordering. Default: false. */
  @Input() dndEnabled = false;

  /** Emits the node that was selected or deselected. */
  @Output() nodeSelected = new EventEmitter<{
    node: JsTreeNode;
    selected: boolean;
    selectedIds: Set<string>;
  }>();

  /** Emits the node that was opened or closed. */
  @Output() nodeToggled = new EventEmitter<{
    node: JsTreeNode;
    opened: boolean;
  }>();

  /** Emits when a node is right-clicked. */
  @Output() nodeContextMenu = new EventEmitter<{
    node: JsTreeNode;
    event: MouseEvent;
  }>();

  /** Emits when a node is double-clicked. */
  @Output() nodeDblClick = new EventEmitter<{ node: JsTreeNode; event: MouseEvent }>();

  /** Emits when an inline rename is committed with a changed label. */
  @Output() nodeRenamed = new EventEmitter<{
    node: JsTreeNode;
    oldText: string;
    newText: string;
  }>();

  /** Emits when a CDK drag-and-drop reorder is completed. */
  @Output() dropNode = new EventEmitter<DropResult>();

  readonly trackById: TrackByFunction<JsTreeNode> = (_i, node) =>
    node.id ?? node.text;

  /** ID of the node currently in inline-rename mode (`null` = none). */
  renamingId: string | null = null;
  /** ID of the node whose children are being lazy-loaded (`null` = none). */
  loadingId: string | null = null;

  private _nodesSubscription?: Subscription;

  constructor(
    private readonly _cdr: ChangeDetectorRef,
    private readonly _treeService: NativeTreeService
  ) {}

  ngOnInit(): void {
    this._treeService.setNodes(this.nodes);
    // Keep `this.nodes` in sync with service mutations (rename, add, remove, move, lazy-load).
    this._nodesSubscription = this._treeService.nodes$.subscribe((nodes) => {
      this.nodes = nodes;
      this._cdr.markForCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nodes'] && !changes['nodes'].firstChange) {
      this._treeService.setNodes(this.nodes);
    }
  }

  ngOnDestroy(): void {
    this._nodesSubscription?.unsubscribe();
  }

  // ------------------------------------------------------------------
  // Public programmatic API
  // ------------------------------------------------------------------

  /**
   * Put a node into inline-rename mode. The input is auto-focused.
   * @param id Node ID (or text if the node has no explicit ID).
   */
  startRename(id: string): void {
    this.renamingId = id;
    this._cdr.markForCheck();
  }

  /** Cancel any active inline rename without saving. */
  cancelRename(): void {
    this.renamingId = null;
    this._cdr.markForCheck();
  }

  // ------------------------------------------------------------------
  // Internal event handlers (bound from template)
  // ------------------------------------------------------------------

  onNodeSelected(event: { node: JsTreeNode; selected: boolean; selectedIds: Set<string> }): void {
    this.selectedIds = event.selectedIds;
    this.nodeSelected.emit(event);
    this._cdr.markForCheck();
  }

  onNodeToggled(event: { node: JsTreeNode; opened: boolean }): void {
    this.nodeToggled.emit(event);
    this._cdr.markForCheck();
  }

  onNodeContextMenu(event: { node: JsTreeNode; event: MouseEvent }): void {
    this.nodeContextMenu.emit(event);
  }

  onNodeDblClick(event: { node: JsTreeNode; event: MouseEvent }): void {
    this.nodeDblClick.emit(event);
  }

  /** Invoked when a child node with `children === true` is expanded. */
  onLoadChildrenRequest(node: JsTreeNode): void {
    if (!this.loadChildren) {
      return;
    }
    const id = node.id ?? node.text;
    this.loadingId = id;
    this._cdr.markForCheck();

    this.loadChildren(node)
      .pipe(take(1))
      .subscribe({
        next: (children) => {
          this._treeService.updateNodeChildren(id, children);
          this._openNodeAfterLoad(id);
          this.loadingId = null;
          this._cdr.markForCheck();
        },
        error: () => {
          this.loadingId = null;
          this._cdr.markForCheck();
        },
      });
  }

  /** Handles confirmed or cancelled inline renames from child nodes. */
  onNodeRenamed(event: { node: JsTreeNode; oldText: string; newText: string }): void {
    this.renamingId = null;
    if (event.newText !== event.oldText) {
      const id = event.node.id ?? event.node.text;
      this._treeService.renameNode(id, event.newText);
      this.nodeRenamed.emit(event);
    }
    this._cdr.markForCheck();
  }

  /** Handles CDK drop events from the root list and all nested lists. */
  onDrop(event: CdkDragDrop<string>): void {
    if (!this.dndEnabled) {
      return;
    }
    const draggedNode = event.item.data as JsTreeNode;
    const oldParentId = event.previousContainer.data as string;
    const newParentId = event.container.data as string;
    const nodeId = draggedNode.id ?? draggedNode.text;

    this._treeService.moveNode(nodeId, newParentId, event.currentIndex);

    this.dropNode.emit({
      nodes: [draggedNode],
      newParentId,
      newPosition: event.currentIndex,
      oldParentId,
      operation: 'move',
      sourceId: 'native-tree',
      targetId: 'native-tree',
    });
  }

  // ------------------------------------------------------------------
  // Private helpers
  // ------------------------------------------------------------------

  private _openNodeAfterLoad(nodeId: string): void {
    const nodes = this._treeService.getNodes();
    const updated = this._setOpenState(nodes, nodeId, true);
    this._treeService.setNodes(updated);
  }

  private _setOpenState(nodes: JsTreeNode[], targetId: string, opened: boolean): JsTreeNode[] {
    return nodes.map((n) => {
      const id = n.id ?? n.text;
      if (id === targetId) {
        return { ...n, state: { ...n.state, opened } };
      }
      if (Array.isArray(n.children) && n.children.length) {
        return {
          ...n,
          children: this._setOpenState(n.children as JsTreeNode[], targetId, opened),
        };
      }
      return n;
    });
  }
}
