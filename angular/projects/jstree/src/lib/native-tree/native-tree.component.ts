import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TrackByFunction,
} from '@angular/core';
import { JsTreeNode } from '../jstree.models';
import { NativeTreeService } from './native-tree.service';

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
    <ul role="tree" class="jstree-container-ul jstree-children" *ngIf="nodes?.length">
      <jstree-native-node
        *ngFor="let node of nodes; trackBy: trackById"
        [node]="node"
        [multiSelect]="multiSelect"
        [selectedIds]="selectedIds"
        [disabledIds]="disabledIds"
        (nodeSelected)="onNodeSelected($event)"
        (nodeToggled)="onNodeToggled($event)"
        (nodeContextMenu)="onNodeContextMenu($event)"
        (nodeDblClick)="onNodeDblClick($event)"
      ></jstree-native-node>
    </ul>
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
})
export class NativeTreeComponent implements OnInit, OnChanges {
  /** Flat or hierarchical array of nodes. */
  @Input() nodes: JsTreeNode[] = [];

  /** Allow selecting multiple nodes (Ctrl/Meta+click). Default: false. */
  @Input() multiSelect = false;

  /** Pre-selected node IDs. */
  @Input() selectedIds: Set<string> = new Set();

  /** Pre-disabled node IDs. */
  @Input() disabledIds: Set<string> = new Set();

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

  readonly trackById: TrackByFunction<JsTreeNode> = (_i, node) =>
    node.id ?? node.text;

  constructor(
    private readonly _cdr: ChangeDetectorRef,
    private readonly _treeService: NativeTreeService
  ) {}

  ngOnInit(): void {
    this._treeService.setNodes(this.nodes);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nodes']) {
      this._treeService.setNodes(this.nodes);
      this._cdr.markForCheck();
    }
  }

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
}
