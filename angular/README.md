# @jstree/angular

Angular integration for [jsTree](http://jstree.com) – the jQuery tree plugin.

This package provides **two independent integration strategies** so you can
pick the right approach for your project:

| Strategy | Component selector | jQuery required? | When to use |
|---|---|---|---|
| **A – jQuery wrapper** | `<jstree-tree>` | ✅ Yes | Drop-in replacement with full jstree feature parity |
| **B – Native Angular** | `<jstree-native-tree>` | ❌ No | New projects, AOT-optimised, fully testable |

---

## Quick start

### 1. Install

```bash
npm install @jstree/angular jquery jstree
```

For TypeScript types:

```bash
npm install --save-dev @types/jquery @types/jstree
```

### 2. Import the module

```typescript
// app.module.ts
import { JstreeModule } from '@jstree/angular';

@NgModule({
  imports: [JstreeModule],
})
export class AppModule {}
```

### 3. Load jQuery & jstree scripts (Strategy A only)

In `angular.json`, add the following to your app's `scripts` array:

```json
"scripts": [
  "node_modules/jquery/dist/jquery.min.js",
  "node_modules/jstree/dist/jstree.min.js"
]
```

And add the jstree CSS to `styles`:

```json
"styles": [
  "node_modules/jstree/dist/themes/default/style.min.css"
]
```

---

## Strategy A – jQuery Wrapper

### Usage

```html
<jstree-tree
  [config]="treeConfig"
  [data]="treeData"
  [plugins]="['checkbox', 'search', 'dnd']"
  (selectNode)="onSelect($event)"
  (changed)="onChanged($event)"
  (createNode)="onCreate($event)"
></jstree-tree>
```

```typescript
import { JsTreeConfig, JsTreeNode, JsTreeNodeEvent, JsTreeChangedEvent } from '@jstree/angular';

@Component({ ... })
export class MyComponent {
  treeData: JsTreeNode[] = [
    {
      id: 'root',
      text: 'Root',
      state: { opened: true },
      children: [
        { id: 'node1', text: 'Node 1' },
        { id: 'node2', text: 'Node 2' },
      ],
    },
  ];

  treeConfig: JsTreeConfig = {
    core: { check_callback: true },
    plugins: ['checkbox', 'search'],
  };

  onSelect(event: JsTreeNodeEvent): void {
    console.log('Selected:', event.node.text);
  }

  onChanged(event: JsTreeChangedEvent): void {
    console.log('Selection changed:', event.selected);
  }
}
```

### Inputs

| Input | Type | Description |
|---|---|---|
| `config` | `JsTreeConfig` | Full jstree options object |
| `data` | `JsTreeNode[] \| string \| null` | Shorthand for `config.core.data` |
| `plugins` | `string[] \| null` | Shorthand for `config.plugins` |

### Outputs

| Output | Payload type | jstree event |
|---|---|---|
| `ready` | `JsTreeEventBase` | `ready.jstree` |
| `loaded` | `JsTreeNodeEvent` | `loaded.jstree` |
| `selectNode` | `JsTreeNodeEvent` | `select_node.jstree` |
| `deselectNode` | `JsTreeNodeEvent` | `deselect_node.jstree` |
| `changed` | `JsTreeChangedEvent` | `changed.jstree` |
| `openNode` | `JsTreeNodeEvent` | `open_node.jstree` |
| `closeNode` | `JsTreeNodeEvent` | `close_node.jstree` |
| `createNode` | `JsTreeNodeEvent` | `create_node.jstree` |
| `renameNode` | `JsTreeRenameEvent` | `rename_node.jstree` |
| `deleteNode` | `JsTreeNodeEvent` | `delete_node.jstree` |
| `moveNode` | `JsTreeMoveEvent` | `move_node.jstree` |
| `copyNode` | `JsTreeMoveEvent` | `copy_node.jstree` |
| `checkNode` | `JsTreeNodeEvent` | `check_node.jstree` |
| `uncheckNode` | `JsTreeNodeEvent` | `uncheck_node.jstree` |
| `searchEvent` | `JsTreeSearchEventData` | `search.jstree` |
| `clearSearch` | `JsTreeSearchEventData` | `clear_search.jstree` |

### Programmatic access

Use `@ViewChild` to call methods directly on the component.
Note: public methods are named with simple verbs to avoid TypeScript naming conflicts with `@Output()` EventEmitters:

```typescript
@ViewChild(JstreeComponent) tree!: JstreeComponent;

addNode(): void {
  const id = this.tree.addNode('#', { text: 'New Node' });
}

openAll(): void {
  this.tree.openAll();
}

expandNode(id: string): void {
  this.tree.expand(id);     // expands (opens) a single node
}

collapseNode(id: string): void {
  this.tree.collapse(id);   // collapses (closes) a single node
}

selectById(id: string): void {
  this.tree.select(id);     // select a node
}

clearSelection(): void {
  this.tree.clearSelection();
}

renameNode(id: string): void {
  this.tree.rename(id, 'New Name');
}

deleteNode(id: string): void {
  this.tree.remove(id);
}

search(str: string): void {
  this.tree.search(str);
}
```

Or inject `JstreeService` for access across components:

```typescript
constructor(private jstreeService: JstreeService) {}

selectFirstNode(hostEl: ElementRef): void {
  this.jstreeService.selectNode(hostEl, 'node_1');
}
```

---

## Strategy B – Native Angular Tree

No jQuery, no external DOM manipulation – pure Angular with `ChangeDetectionStrategy.OnPush`.

### Usage

```html
<jstree-native-tree
  [nodes]="nodes"
  [multiSelect]="true"
  [selectedIds]="selection"
  (nodeSelected)="onSelect($event)"
  (nodeToggled)="onToggle($event)"
></jstree-native-tree>
```

### Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `nodes` | `JsTreeNode[]` | `[]` | Root nodes of the tree |
| `multiSelect` | `boolean` | `false` | Allow Ctrl/Meta+click multi-select |
| `selectedIds` | `Set<string>` | `new Set()` | Pre-selected node IDs |
| `disabledIds` | `Set<string>` | `new Set()` | Pre-disabled node IDs |

### Outputs

| Output | Payload |
|---|---|
| `nodeSelected` | `{ node, selected: boolean, selectedIds: Set<string> }` |
| `nodeToggled` | `{ node, opened: boolean }` |
| `nodeContextMenu` | `{ node, event: MouseEvent }` |
| `nodeDblClick` | `{ node, event: MouseEvent }` |

### Search filtering (pipe)

```html
<jstree-native-tree
  [nodes]="nodes | jsTreeSearch : searchStr : { fuzzy: true }"
></jstree-native-tree>
```

---

## Strategy B – Plugins

All plugins are provided as injectable Angular services or directives.

### SortService

```typescript
import { SortService } from '@jstree/angular';

const sorted = sortService.sort(nodes);                       // alphabetical
const custom = sortService.sort(nodes, (a, b) => ...);       // custom comparator
const flat   = sortService.sort(nodes, undefined, false);     // non-recursive
```

### UniqueService

```typescript
const ok = uniqueService.isUnique('New Name', siblings);
const dups = uniqueService.findDuplicates(siblings);
```

### ChangedService

```typescript
changedService.change$.subscribe(change => ...);
changedService.selectionChange$.subscribe(change => ...);
changedService.structuralChange$.subscribe(change => ...);

// Record a change (called by tree internals or manually):
changedService.record('select', node);
```

### StateService

```typescript
stateService.configure({ key: 'my_tree', ttl: 86_400_000 }); // 24 h TTL

// After every tree change:
stateService.save(openIds, selectedIds);

// On init:
const state = stateService.load();
if (state) {
  this.nodes = stateService.applyToNodes(this.nodes, state);
}
```

### TypesService

```typescript
typesService.register({
  folder: { icon: 'fa fa-folder', valid_children: ['file', 'folder'] },
  file:   { icon: 'fa fa-file',   valid_children: [] },
});

typesService.canHaveChild('folder', 'file');   // true
typesService.getIcon(node);                    // resolves icon from type
```

### CheckboxDirective

```html
<jstree-native-tree
  jsTreeCheckbox
  [nodes]="nodes"
  [checkedIds]="checkedSet"
  [threeState]="true"
  (checkChange)="onCheckChange($event)"
></jstree-native-tree>
```

### ContextmenuDirective

```html
<jstree-native-tree
  jsTreeContextmenu
  [contextMenuItems]="items"
  (menuItemClicked)="onMenuClick($event)"
></jstree-native-tree>
```

### WholerowDirective

```html
<jstree-native-tree jsTreeWholerow [wholerowEnabled]="true"></jstree-native-tree>
```

### ConditionalSelectDirective

```html
<jstree-native-tree
  jsTreeConditionalSelect
  [canSelect]="myGuard"
></jstree-native-tree>
```

```typescript
myGuard = (node: JsTreeNode) => node.type !== 'locked';
```

### MassLoadService

```typescript
massLoadService
  .load(['id_1', 'id_2'], { url: '/api/tree/children' })
  .subscribe(map => applyChildren(map));
```

### DndService

```typescript
// Drag start
dndService.startDrag([node], 'move', 'tree-1');

// Drop
dndService.notifyDrop({ nodes, newParentId: '#', ... });

// Listen for drops
dndService.drop$.subscribe(result => applyMove(result));
```

---

## Building the library

```bash
cd angular
npm install
npm run build         # builds the library to dist/jstree/
```

## Running the demo app

```bash
cd angular
npm install
npm start             # serves at http://localhost:4200
```

## Running tests

```bash
cd angular
npm test              # runs karma/jasmine tests for the library
```

---

## Roadmap (completing Strategy B)

- [ ] Virtual scrolling for very large trees (Angular CDK `ScrollingModule`)
- [ ] Full CDK Drag-Drop integration in `NativeTreeComponent`
- [ ] CDK Overlay for `ContextmenuDirective`
- [ ] Inline rename editing
- [ ] Lazy-load integration with `MassLoadService`
- [ ] Animations via Angular `AnimationBuilder`
- [ ] SCSS theme (`@use 'jstree/src/themes/default/style.css'` port)
- [ ] Storybook documentation

---

## License

MIT – same as the original [jsTree](https://github.com/vakata/jstree).
