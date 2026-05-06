import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  TrackByFunction,
} from '@angular/core';
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
    >
      <!-- Indentation spacers for nested levels are handled by CSS via
           the recursive nesting of <ul> elements. -->

      <!-- Toggle icon -->
      <i
        *ngIf="hasChildren"
        class="jstree-icon jstree-ocl"
        role="presentation"
        (click)="toggle($event)"
      ></i>
      <i *ngIf="!hasChildren" class="jstree-icon jstree-ocl" role="presentation"></i>

      <!-- Node icon -->
      <i
        *ngIf="node.icon !== false"
        class="jstree-icon jstree-themeicon"
        [class]="iconClass"
        [style.background-image]="iconImage"
        role="presentation"
      ></i>

      <!-- Node anchor -->
      <a
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
        role="group"
        class="jstree-children"
      >
        <jstree-native-node
          *ngFor="let child of children; trackBy: trackById"
          [node]="child"
          [multiSelect]="multiSelect"
          [selectedIds]="selectedIds"
          [disabledIds]="disabledIds"
          (nodeSelected)="nodeSelected.emit($event)"
          (nodeToggled)="nodeToggled.emit($event)"
          (nodeContextMenu)="nodeContextMenu.emit($event)"
          (nodeDblClick)="nodeDblClick.emit($event)"
        ></jstree-native-node>
      </ul>
    </li>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NativeTreeNodeComponent implements OnChanges {
  @Input() node!: JsTreeNode;
  @Input() multiSelect = false;
  @Input() selectedIds: Set<string> = new Set();
  @Input() disabledIds: Set<string> = new Set();

  @Output() nodeSelected = new EventEmitter<{
    node: JsTreeNode;
    selected: boolean;
    selectedIds: Set<string>;
  }>();
  @Output() nodeToggled = new EventEmitter<{ node: JsTreeNode; opened: boolean }>();
  @Output() nodeContextMenu = new EventEmitter<{ node: JsTreeNode; event: MouseEvent }>();
  @Output() nodeDblClick = new EventEmitter<{ node: JsTreeNode; event: MouseEvent }>();

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

  get liClasses(): string {
    const base = 'jstree-node';
    const open = this.isOpen ? ' jstree-open' : ' jstree-closed';
    const leaf = !this.hasChildren ? ' jstree-leaf' : '';
    const last = ' jstree-last'; // simplified; a real impl would track sibling position
    return base + (this.hasChildren ? open : leaf) + last;
  }

  /** Returns a CSS class string if the icon is a class name. */
  get iconClass(): string {
    const icon = this.node.icon;
    if (!icon || typeof icon !== 'string') {
      return 'jstree-themeicon-custom';
    }
    return icon.startsWith('./') || icon.startsWith('/') || icon.startsWith('http')
      ? ''
      : icon;
  }

  /** Returns a CSS `background-image` value if the icon is an image URL. */
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
    // Double-click also toggles open/close
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
}
