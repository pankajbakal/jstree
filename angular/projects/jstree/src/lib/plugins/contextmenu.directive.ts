import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  Renderer2,
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { JsTreeContextMenuItem, JsTreeNode } from '../jstree.models';

/**
 * ## ContextmenuDirective  (Strategy B – replaces `jstree.contextmenu.js`)
 *
 * Renders a custom context menu when the user right-clicks a tree node.
 * Uses the Angular CDK Overlay for positioning and stacking-context management.
 *
 * ### Usage
 * ```html
 * <jstree-native-tree
 *   jsTreeContextmenu
 *   [contextMenuItems]="myItems"
 *   (menuItemClicked)="onMenuItemClick($event)"
 * ></jstree-native-tree>
 * ```
 */
@Directive({ selector: '[jsTreeContextmenu]', standalone: false })
export class ContextmenuDirective implements OnDestroy {
  /**
   * Static menu items or a factory function that returns items for a node.
   */
  @Input() contextMenuItems:
    | Record<string, JsTreeContextMenuItem>
    | ((node: JsTreeNode) => Record<string, JsTreeContextMenuItem>)
    | null = null;

  /**
   * Optional resolver called with a node ID to look up the full node object
   * from the application's data source.  When provided, this is always
   * preferred over DOM-based node reconstruction.
   */
  @Input() nodeResolver: ((nodeId: string) => JsTreeNode | null) | null = null;

  /** Emits when a menu item is activated. */
  @Output() menuItemClicked = new EventEmitter<{
    item: JsTreeContextMenuItem;
    node: JsTreeNode | null;
  }>();

  private _overlayRef: OverlayRef | null = null;
  private _activeNode: JsTreeNode | null = null;
  private _unlisten: (() => void) | null = null;

  constructor(
    private readonly _el: ElementRef<HTMLElement>,
    private readonly _renderer: Renderer2,
    private readonly _overlay: Overlay
  ) {}

  ngOnDestroy(): void {
    this._hide();
  }

  // ------------------------------------------------------------------
  // Host listeners
  // ------------------------------------------------------------------

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    const anchor = (event.target as HTMLElement).closest('.jstree-anchor');
    const li = anchor?.closest('li[role="treeitem"]') as HTMLElement | null;
    const nodeId = li?.id ?? null;

    if (nodeId) {
      this._activeNode = this.nodeResolver
        ? this.nodeResolver(nodeId)
        : {
            id: nodeId,
            text: (li?.querySelector('.jstree-anchor') as HTMLElement | null)
              ?.textContent?.trim() ?? '',
          };
    } else {
      this._activeNode = null;
    }

    this._show(event.clientX, event.clientY, this._activeNode);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this._overlayRef && !this._overlayRef.overlayElement.contains(event.target as Node)) {
      this._hide();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this._hide();
  }

  // ------------------------------------------------------------------
  // Private helpers
  // ------------------------------------------------------------------

  private _show(x: number, y: number, node: JsTreeNode | null): void {
    this._hide();

    const items = this._resolveItems(node);
    if (!items || !Object.keys(items).length) {
      return;
    }

    const menu = this._renderer.createElement('ul') as HTMLElement;
    this._renderer.addClass(menu, 'jstree-contextmenu');

    for (const [, item] of Object.entries(items)) {
      if (item.separator_before) {
        const sep = this._renderer.createElement('li') as HTMLElement;
        this._renderer.addClass(sep, 'jstree-contextmenu-separator');
        this._renderer.appendChild(menu, sep);
      }

      const li = this._renderer.createElement('li') as HTMLElement;
      const label = typeof item.label === 'function' ? item.label() : item.label;
      this._renderer.setProperty(li, 'textContent', label);

      if (item._disabled) {
        const disabled =
          typeof item._disabled === 'function'
            ? item._disabled({ item, reference: this._el.nativeElement, element: menu, position: { x, y } })
            : item._disabled;
        if (disabled) {
          this._renderer.addClass(li, 'jstree-contextmenu-disabled');
        }
      }

      if (item.icon) {
        const icon = this._renderer.createElement('i') as HTMLElement;
        this._renderer.setAttribute(icon, 'class', item.icon);
        this._renderer.insertBefore(li, icon, li.firstChild);
      }

      this._renderer.listen(li, 'click', () => {
        if (item.action) {
          item.action({
            item,
            reference: this._el.nativeElement,
            element: menu,
            position: { x, y },
          });
        }
        this.menuItemClicked.emit({ item, node });
        this._hide();
      });

      this._renderer.appendChild(menu, li);

      if (item.separator_after) {
        const sep = this._renderer.createElement('li') as HTMLElement;
        this._renderer.addClass(sep, 'jstree-contextmenu-separator');
        this._renderer.appendChild(menu, sep);
      }
    }

    // Use CDK Overlay for positioning and z-index management
    this._overlayRef = this._overlay.create({
      positionStrategy: this._overlay
        .position()
        .global()
        .left(`${x}px`)
        .top(`${y}px`),
      scrollStrategy: this._overlay.scrollStrategies.close(),
      hasBackdrop: false,
    });

    this._renderer.appendChild(this._overlayRef.overlayElement, menu);

    // Adjust if the menu overflows the viewport (after one tick for layout)
    setTimeout(() => {
      if (!this._overlayRef) {
        return;
      }
      const rect = menu.getBoundingClientRect();
      let left = x;
      let top = y;
      if (rect.right > window.innerWidth) {
        left = x - rect.width;
      }
      if (rect.bottom > window.innerHeight) {
        top = y - rect.height;
      }
      this._overlayRef.updatePositionStrategy(
        this._overlay.position().global().left(`${left}px`).top(`${top}px`)
      );
      this._overlayRef.updatePosition();
    }, 0);
  }

  private _hide(): void {
    if (this._overlayRef) {
      this._overlayRef.dispose();
      this._overlayRef = null;
    }
    if (this._unlisten) {
      this._unlisten();
      this._unlisten = null;
    }
    this._activeNode = null;
  }

  private _resolveItems(
    node: JsTreeNode | null
  ): Record<string, JsTreeContextMenuItem> | null {
    if (!this.contextMenuItems) {
      return null;
    }
    if (typeof this.contextMenuItems === 'function') {
      return node ? this.contextMenuItems(node) : null;
    }
    return this.contextMenuItems;
  }
}
