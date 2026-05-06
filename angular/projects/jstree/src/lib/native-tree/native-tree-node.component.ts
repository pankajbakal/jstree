import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  TrackByFunction,
  ViewChild,
} from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { JsTreeNode } from '../jstree.models';

/**
 * ## NativeTreeNodeComponent  (Strategy B)
 *
 * Renders a single node and recursively renders its children.
 * Used internally by `NativeTreeComponent`.
 */
@Component({
  selector: 'jstree-native-node',
  template: `
    <li
      role="treeitem"
      [id]="node.id"
      [attr.aria-selected]="isSelected"
      [attr.aria-expanded]="hasChildren ? isOpen : null"
      [attr.aria-disabled]="isDisabled || null"
      [class]="liClasses"
      (click)="handleClick($event)"
      (dblclick)="handleDblClick($event)"
      (contextmenu)="handleContextMenu($event)"
      (keydown)="handleKeydown($event)"
      [tabindex]="isSelected ? 0 : -1"
      cdkDrag
      [cdkDragData]="node"
      [cdkDragDisabled]="!dndEnabled"
    >
      <!-- Toggle icon -->
      <i
        *ngIf="hasChildren || isLoading"
        class="jstree-icon jstree-ocl"
        [class.jstree-loading]="isLoading"
        role="presentation"
        (click)="toggle($event)"
      ></i>
      <i *ngIf="!hasChildren && !isLoading" class="jstree-icon jstree-ocl" role="presentation"></i>

      <!-- Node icon -->
      <i
        *ngIf="node.icon !== false"
        class="jstree-icon jstree-themeicon"
        [class]="iconClass"
        [style.background-image]="iconImage"
        role="presentation"
      ></i>

      <!-- Inline rename input (shown only when this node is in rename mode) -->
      <input
        *ngIf="isRenaming"
        #renameInput
        class="jstree-rename-input"
        [value]="node.text"
        (keydown.enter)="onRenameConfirm($event)"
        (keydown.escape)="onRenameCancel()"
        (blur)="onRenameConfirm($event)"
        (click)="$event.stopPropagation()"
      />

      <!-- Node anchor (hidden while renaming) -->
      <a
        *ngIf="!isRenaming"
        class="jstree-anchor"
        [class.jstree-clicked]="isSelected"
        [class.jstree-disabled]="isDisabled"
        href="#"
        (click)="handleAnchorClick($event)"
        [attr.title]="node.text"
        [innerHTML]="node.text"
      ></a>

      <!-- Children -->
      <ul
        *ngIf="hasChildren && isOpen"
        @expandCollapse
        role="group"
        class="jstree-children"
        cdkDropList
        [cdkDropListData]="node.id ?? node.text"
        [cdkDropListDisabled]="!dndEnabled"
        (cdkDropListDropped)="dropNode.emit($event)"
      >
        <jstree-native-node
          *ngFor="let child of children; trackBy: trackById"
          [node]="child"
          [multiSelect]="multiSelect"
          [selectedIds]="selectedIds"
          [disabledIds]="disabledIds"
          [renamingId]="renamingId"
          [loadingId]="loadingId"
          [dndEnabled]="dndEnabled"
          (nodeSelected)="nodeSelected.emit($event)"
          (nodeToggled)="nodeToggled.emit($event)"
          (nodeContextMenu)="nodeContextMenu.emit($event)"
          (nodeDblClick)="nodeDblClick.emit($event)"
          (loadChildrenRequest)="loadChildrenRequest.emit($event)"
          (nodeRenamed)="nodeRenamed.emit($event)"
          (dropNode)="dropNode.emit($event)"
        ></jstree-native-node>
      </ul>
    </li>
  `,
  styles: [`
    .jstree-rename-input {
      border: 1px solid #aaa;
      padding: 1px 4px;
      font-size: inherit;
      font-family: inherit;
      outline: none;
      width: 120px;
    }
    .jstree-loading::before {
      content: '';
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid #ccc;
      border-top-color: #888;
      border-radius: 50%;
      animation: jstree-spin 0.6s linear infinite;
      vertical-align: middle;
    }
    @keyframes jstree-spin {
      to { transform: rotate(360deg); }
    }
  `],
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: 0, overflow: 'hidden', opacity: 0 }),
        animate('200ms ease-out', style({ height: '*', overflow: 'hidden', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ height: 0, overflow: 'hidden', opacity: 0 })),
      ]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class NativeTreeNodeComponent implements OnChanges {
  @Input() node!: JsTreeNode;
  @Input() multiSelect = false;
  @Input() selectedIds: Set<string> = new Set();
  @Input() disabledIds: Set<string> = new Set();
  /** ID of the node currently in rename mode (`null` = none). */
  @Input() renamingId: string | null = null;
  /** ID of the node whose children are being loaded (`null` = none). */
  @Input() loadingId: string | null = null;
  /** Enable CDK drag-and-drop. */
  @Input() dndEnabled = false;

  @Output() nodeSelected = new EventEmitter<{
    node: JsTreeNode;
    selected: boolean;
    selectedIds: Set<string>;
  }>();
  @Output() nodeToggled = new EventEmitter<{ node: JsTreeNode; opened: boolean }>();
  @Output() nodeContextMenu = new EventEmitter<{ node: JsTreeNode; event: MouseEvent }>();
  @Output() nodeDblClick = new EventEmitter<{ node: JsTreeNode; event: MouseEvent }>();
  /** Emits when a node with `children === true` is first expanded (lazy-load). */
  @Output() loadChildrenRequest = new EventEmitter<JsTreeNode>();
  /** Emits when a rename is confirmed or cancelled. */
  @Output() nodeRenamed = new EventEmitter<{
    node: JsTreeNode;
    oldText: string;
    newText: string;
  }>();
  /** Bubbles CDK drop events from nested lists. */
  @Output() dropNode = new EventEmitter<CdkDragDrop<string>>();

  @ViewChild('renameInput') renameInputRef?: ElementRef<HTMLInputElement>;

  isOpen = false;
  children: JsTreeNode[] = [];

  readonly trackById: TrackByFunction<JsTreeNode> = (_i, n) => n.id ?? n.text;

  constructor(private readonly _cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['node']) {
      this.isOpen = this.node.state?.opened ?? false;
      this.children = Array.isArray(this.node.children)
        ? (this.node.children as JsTreeNode[])
        : [];
    }
    if (changes['renamingId'] && this.isRenaming) {
      setTimeout(() => this.renameInputRef?.nativeElement.select(), 0);
    }
  }

  get isSelected(): boolean {
    return this.selectedIds.has(this.node.id ?? this.node.text);
  }

  get isDisabled(): boolean {
    return (
      (this.node.state?.disabled ?? false) ||
      this.disabledIds.has(this.node.id ?? this.node.text)
    );
  }

  get hasChildren(): boolean {
    return (
      (Array.isArray(this.node.children) && this.node.children.length > 0) ||
      this.node.children === true
    );
  }

  get isRenaming(): boolean {
    return this.renamingId === (this.node.id ?? this.node.text);
  }

  get isLoading(): boolean {
    return this.loadingId === (this.node.id ?? this.node.text);
  }

  get liClasses(): string {
    const base = 'jstree-node';
    const open = this.isOpen ? ' jstree-open' : ' jstree-closed';
    const leaf = !this.hasChildren ? ' jstree-leaf' : '';
    const last = ' jstree-last';
    return base + (this.hasChildren ? open : leaf) + last;
  }

  get iconClass(): string {
    const icon = this.node.icon;
    if (!icon || typeof icon !== 'string') {
      return 'jstree-themeicon-custom';
    }
    return icon.startsWith('./') || icon.startsWith('/') || icon.startsWith('http')
      ? ''
      : icon;
  }

  get iconImage(): string | null {
    const icon = this.node.icon;
    if (
      typeof icon === 'string' &&
      (icon.startsWith('./') || icon.startsWith('/') || icon.startsWith('http'))
    ) {
      return `url(${icon})`;
    }
    return null;
  }

  toggle(event: Event): void {
    event.stopPropagation();
    if (this.isDisabled) {
      return;
    }
    // Lazy-load: emit a request and let the parent handle it
    if (!this.isOpen && this.node.children === true) {
      this.loadChildrenRequest.emit(this.node);
      return;
    }
    this.isOpen = !this.isOpen;
    this.nodeToggled.emit({ node: this.node, opened: this.isOpen });
    this._cdr.markForCheck();
  }

  handleClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  handleAnchorClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.isDisabled) {
      return;
    }
    const id = this.node.id ?? this.node.text;
    let next: Set<string>;

    if (this.multiSelect && (event.ctrlKey || event.metaKey)) {
      next = new Set(this.selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
    } else {
      next = new Set<string>([id]);
    }

    this.nodeSelected.emit({
      node: this.node,
      selected: next.has(id),
      selectedIds: next,
    });
  }

  handleDblClick(event: MouseEvent): void {
    event.preventDefault();
    this.nodeDblClick.emit({ node: this.node, event });
    this.toggle(event);
  }

  handleContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.nodeContextMenu.emit({ node: this.node, event });
  }

  handleKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.handleAnchorClick(event as unknown as MouseEvent);
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (this.hasChildren && !this.isOpen) {
          this.toggle(event);
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (this.isOpen) {
          this.toggle(event);
        }
        break;
      default:
        break;
    }
  }

  onRenameConfirm(event: Event): void {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    const newText = input.value.trim();
    const oldText = this.node.text;
    this.nodeRenamed.emit({ node: this.node, oldText, newText: newText || oldText });
  }

  onRenameCancel(): void {
    this.nodeRenamed.emit({ node: this.node, oldText: this.node.text, newText: this.node.text });
  }
}
