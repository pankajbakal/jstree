import { Component, ViewChild } from '@angular/core';
import {
  JstreeComponent,
  JstreeService,
  JsTreeConfig,
  JsTreeNode,
  JsTreeChangedEvent,
  JsTreeNodeEvent,
  JsTreeContextMenuItem,
} from '@jstree/angular';

/**
 * Demo application showcasing both:
 *  - Strategy A: jQuery wrapper via `<jstree-tree>`
 *  - Strategy B: Native Angular tree via `<jstree-native-tree>`
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  @ViewChild('wrapperTree') wrapperTree!: JstreeComponent;

  // ------------------------------------------------------------------
  // Shared sample data
  // ------------------------------------------------------------------

  readonly sampleNodes: JsTreeNode[] = [
    {
      id: 'fruits',
      text: 'Fruits',
      state: { opened: true },
      children: [
        {
          id: 'citrus',
          text: 'Citrus',
          children: [
            { id: 'lemon',  text: 'Lemon'  },
            { id: 'orange', text: 'Orange' },
            { id: 'lime',   text: 'Lime'   },
          ],
        },
        { id: 'apple',  text: 'Apple'  },
        { id: 'banana', text: 'Banana' },
      ],
    },
    {
      id: 'veggies',
      text: 'Vegetables',
      children: [
        { id: 'carrot',  text: 'Carrot'  },
        { id: 'spinach', text: 'Spinach' },
        { id: 'pea',     text: 'Pea'     },
      ],
    },
  ];

  // ------------------------------------------------------------------
  // Strategy A – jQuery wrapper config
  // ------------------------------------------------------------------

  readonly wrapperConfig: JsTreeConfig = {
    core: {
      data: this.sampleNodes,
      check_callback: true,
      themes: { dots: true, icons: true },
    },
    plugins: ['checkbox', 'search', 'contextmenu'],
    contextmenu: {
      items: this._contextMenuItems(),
    },
  };

  wrapperSearchStr = '';
  wrapperLog: string[] = [];

  // ------------------------------------------------------------------
  // Strategy B – Native Angular tree
  // ------------------------------------------------------------------

  nativeNodes: JsTreeNode[] = [...this.sampleNodes];
  nativeSelectedIds: Set<string> = new Set();
  nativeSearchStr = '';
  nativeLog: string[] = [];

  readonly nativeContextMenuItems: Record<string, JsTreeContextMenuItem> = {
    add: {
      label: 'Add child',
      icon: '',
      action: () => this._addNativeNode(),
    },
    delete: {
      label: 'Delete',
      separator_before: true,
      action: () => this._deleteLastSelected(),
    },
  };

  constructor(private readonly _jstreeService: JstreeService) {}

  // ------------------------------------------------------------------
  // Strategy A handlers
  // ------------------------------------------------------------------

  onWrapperChanged(event: JsTreeChangedEvent): void {
    this._log(this.wrapperLog, `changed: action=${event.action}`);
  }

  onWrapperSelectNode(event: JsTreeNodeEvent): void {
    this._log(this.wrapperLog, `selected: ${event.node.text}`);
  }

  onWrapperSearch(): void {
    if (this.wrapperTree) {
      this.wrapperTree.search(this.wrapperSearchStr);
    }
  }

  onWrapperClearSearch(): void {
    this.wrapperSearchStr = '';
    if (this.wrapperTree) {
      this.wrapperTree.clearSearchResults();
    }
  }

  onWrapperAddNode(): void {
    if (this.wrapperTree) {
      const newId = this.wrapperTree.addNode('#', { text: 'New Node' });
      this._log(this.wrapperLog, `created node id=${newId}`);
    }
  }

  // ------------------------------------------------------------------
  // Strategy B handlers
  // ------------------------------------------------------------------

  onNativeNodeSelected(event: {
    node: JsTreeNode;
    selected: boolean;
    selectedIds: Set<string>;
  }): void {
    this.nativeSelectedIds = event.selectedIds;
    this._log(this.nativeLog, `selected: ${event.node.text} (${event.selected ? '✓' : '✗'})`);
  }

  onNativeNodeToggled(event: { node: JsTreeNode; opened: boolean }): void {
    this._log(this.nativeLog, `${event.opened ? 'opened' : 'closed'}: ${event.node.text}`);
  }

  // ------------------------------------------------------------------
  // Private helpers
  // ------------------------------------------------------------------

  private _log(log: string[], msg: string): void {
    log.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
    if (log.length > 30) {
      log.pop();
    }
  }

  private _contextMenuItems(): Record<string, JsTreeContextMenuItem> {
    return {
      create: {
        label: 'Create',
        action: (data) => {
          const tree = this.wrapperTree;
          if (tree) {
            tree.addNode(data.reference.id || '#', { text: 'New Node' });
          }
        },
      },
      rename: {
        label: 'Rename',
        action: (data) => {
          const tree = this.wrapperTree;
          if (tree) {
            tree.rename(data.reference.id, 'Renamed');
          }
        },
      },
      delete: {
        label: 'Delete',
        separator_before: true,
        action: (data) => {
          const tree = this.wrapperTree;
          if (tree) {
            tree.remove(data.reference.id);
          }
        },
      },
    };
  }

  private _addNativeNode(): void {
    const newNode: JsTreeNode = {
      id: `native_${Date.now()}`,
      text: 'New Fruit',
    };
    const updated = structuredClone(this.nativeNodes) as JsTreeNode[];
    (updated[0].children as JsTreeNode[]).push(newNode);
    this.nativeNodes = updated;
    this._log(this.nativeLog, `added: ${newNode.text}`);
  }

  private _deleteLastSelected(): void {
    const id = [...this.nativeSelectedIds][0];
    if (!id) {
      return;
    }
    this.nativeNodes = this._removeById(id, structuredClone(this.nativeNodes) as JsTreeNode[]);
    this.nativeSelectedIds = new Set();
    this._log(this.nativeLog, `deleted: ${id}`);
  }

  private _removeById(id: string, nodes: JsTreeNode[]): JsTreeNode[] {
    return nodes
      .filter((n) => n.id !== id)
      .map((n) => ({
        ...n,
        children: Array.isArray(n.children)
          ? this._removeById(id, n.children as JsTreeNode[])
          : n.children,
      }));
  }
}
