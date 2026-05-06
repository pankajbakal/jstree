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
import { JsTreeContextMenuItem, JsTreeNode } from '../jstree.models';

/**
 * ## ContextmenuDirective  (Strategy B – replaces `jstree.contextmenu.js`)
 *
 * Renders a custom context menu when the user right-clicks a tree node.
 * Uses a plain DOM overlay instead of the Angular CDK Overlay to keep
 * the library dependency footprint small; replace with `OverlayModule`
 * if you prefer CDK.
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
@Directive({ selector: '[jsTreeContextmenu]' })
export class ContextmenuDirective implements OnDestroy {
  /**
   * Static menu items or a factory function that returns items for a node.
   */
  @Input() contextMenuItems:
    | Record<string, JsTreeContextMenuItem>
    | ((node: JsTreeNode) => Record<string, JsTreeContextMenuItem>)
    | null = null;

  /** Emits when a menu item is activated. */
  @Output() menuItemClicked = new EventEmitter<{
    item: JsTreeContextMenuItem;
    node: JsTreeNode | null;
  }>();

  private _menuEl: HTMLElement | null = null;
  private _activeNode: JsTreeNode | null = null;
  private _unlisten: (() => void) | null = null;

  constructor(
    private readonly _el: ElementRef<HTMLElement>,
    private readonly _renderer: Renderer2
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
    // Try to find a node reference from the event target
    const anchor = (event.target as HTMLElement).closest('.jstree-anchor');
    // In the native tree, the node id is on the parent <li>
    const li = anchor?.closest('li[role="treeitem"]');
    const nodeId = li?.id ?? null;
    this._activeNode = nodeId ? ({ id: nodeId, text: li?.querySelector('.jstree-anchor')?.textContent ?? '' } as JsTreeNode) : null;

    this._show(event.clientX, event.clientY, this._activeNode);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this._menuEl && !this._menuEl.contains(event.target as Node)) {
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
    this._renderer.setStyle(menu, 'position', 'fixed');
    this._renderer.setStyle(menu, 'zIndex', '9999');
    this._renderer.setStyle(menu, 'left', `${x}px`);
    this._renderer.setStyle(menu, 'top', `${y}px`);

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

    this._renderer.appendChild(document.body, menu);
    this._menuEl = menu;

    // Ensure the menu stays inside the viewport
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this._renderer.setStyle(menu, 'left', `${x - rect.width}px`);
    }
    if (rect.bottom > window.innerHeight) {
      this._renderer.setStyle(menu, 'top', `${y - rect.height}px`);
    }
  }

  private _hide(): void {
    if (this._menuEl) {
      this._renderer.removeChild(document.body, this._menuEl);
      this._menuEl = null;
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
