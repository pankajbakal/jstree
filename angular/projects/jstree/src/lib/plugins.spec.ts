import { TestBed } from '@angular/core/testing';
import { SortService } from './plugins/sort.service';
import { UniqueService } from './plugins/unique.service';
import { ChangedService } from './plugins/changed.service';
import { StateService } from './plugins/state.service';
import { TypesService } from './plugins/types.service';
import { MassLoadService } from './plugins/massload.service';
import { DndService } from './plugins/dnd.service';
import { NativeTreeService } from './native-tree/native-tree.service';
import { JstreeSearchPipe } from './plugins/search.pipe';
import { JsTreeNode } from './jstree.models';

// ---------------------------------------------------------------------------
// SortService
// ---------------------------------------------------------------------------

describe('SortService', () => {
  let service: SortService;

  const nodes: JsTreeNode[] = [
    { id: 'b', text: 'Banana' },
    { id: 'a', text: 'Apple' },
    { id: 'c', text: 'cherry' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SortService] });
    service = TestBed.inject(SortService);
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('sorts alphabetically case-insensitively', () => {
    const result = service.sort(nodes);
    expect(result.map((n) => n.text)).toEqual(['Apple', 'Banana', 'cherry']);
  });

  it('does not mutate the input array', () => {
    const copy = [...nodes];
    service.sort(nodes);
    expect(nodes).toEqual(copy);
  });

  it('supports a custom comparator', () => {
    const result = service.sort(nodes, (a, b) => b.text.localeCompare(a.text));
    expect(result[0].text).toBe('cherry');
  });

  it('recursively sorts children when recursive=true', () => {
    const tree: JsTreeNode[] = [
      {
        id: 'root',
        text: 'Root',
        children: [
          { id: 'z', text: 'Zebra' },
          { id: 'a', text: 'Ant' },
        ],
      },
    ];
    const [root] = service.sort(tree);
    const children = root.children as JsTreeNode[];
    expect(children[0].text).toBe('Ant');
  });
});

// ---------------------------------------------------------------------------
// UniqueService
// ---------------------------------------------------------------------------

describe('UniqueService', () => {
  let service: UniqueService;
  const siblings: JsTreeNode[] = [
    { id: '1', text: 'Alpha' },
    { id: '2', text: 'Beta' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [UniqueService] });
    service = TestBed.inject(UniqueService);
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('returns true for a unique text', () =>
    expect(service.isUnique('Gamma', siblings)).toBeTrue());

  it('returns false for a duplicate text (case-insensitive)', () =>
    expect(service.isUnique('alpha', siblings)).toBeFalse());

  it('excludes a node by id when renaming', () =>
    expect(service.isUnique('Alpha', siblings, '1')).toBeTrue());

  it('finds duplicates in an array', () => {
    const dups = service.findDuplicates([
      { id: 'a', text: 'foo' },
      { id: 'b', text: 'Foo' },
    ]);
    expect(dups).toContain('foo');
  });
});

// ---------------------------------------------------------------------------
// ChangedService
// ---------------------------------------------------------------------------

describe('ChangedService', () => {
  let service: ChangedService;
  const node: JsTreeNode = { id: 'n1', text: 'N1' };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ChangedService] });
    service = TestBed.inject(ChangedService);
  });

  afterEach(() => service.ngOnDestroy());

  it('should be created', () => expect(service).toBeTruthy());

  it('emits on change$', (done) => {
    service.change$.subscribe((c) => {
      expect(c.action).toBe('select');
      done();
    });
    service.record('select', node);
  });

  it('emits on selectionChange$ for select/deselect', (done) => {
    service.selectionChange$.subscribe((c) => {
      expect(c.action).toBe('deselect');
      done();
    });
    service.record('deselect', node);
  });

  it('emits on visibilityChange$ for open/close', (done) => {
    service.visibilityChange$.subscribe((c) => {
      expect(c.action).toBe('open');
      done();
    });
    service.record('open', node);
  });

  it('emits on structuralChange$ for create/rename/delete', (done) => {
    service.structuralChange$.subscribe((c) => {
      expect(c.action).toBe('create');
      done();
    });
    service.record('create', node);
  });
});

// ---------------------------------------------------------------------------
// StateService
// ---------------------------------------------------------------------------

describe('StateService', () => {
  let service: StateService;
  const storeMock: Record<string, string> = {};
  const storageMock: Storage = {
    length: 0,
    clear: () => { for (const k in storeMock) { delete storeMock[k]; } },
    getItem: (k) => storeMock[k] ?? null,
    key: () => null,
    removeItem: (k) => { delete storeMock[k]; },
    setItem: (k, v) => { storeMock[k] = v; },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [StateService] });
    service = TestBed.inject(StateService);
    service.configure({ key: 'test_state', storage: storageMock });
    storageMock.clear();
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('save() and load() round-trip', () => {
    service.save(['n1', 'n2'], ['n3']);
    const state = service.load();
    expect(state?.open).toEqual(['n1', 'n2']);
    expect(state?.selected).toEqual(['n3']);
  });

  it('load() returns null when nothing saved', () =>
    expect(service.load()).toBeNull());

  it('clear() removes stored state', () => {
    service.save(['x'], []);
    service.clear();
    expect(service.load()).toBeNull();
  });

  it('applyToNodes() opens and selects correct nodes', () => {
    const nodes: JsTreeNode[] = [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
    ];
    const result = service.applyToNodes(nodes, {
      open: ['a'],
      selected: ['b'],
      savedAt: Date.now(),
    });
    expect(result.find((n) => n.id === 'a')?.state?.opened).toBeTrue();
    expect(result.find((n) => n.id === 'b')?.state?.selected).toBeTrue();
  });

  it('load() returns null when TTL has expired', () => {
    service.configure({ key: 'test_state', storage: storageMock, ttl: 1 });
    // Manually write a state that is 1 minute old
    const old = JSON.stringify({ open: [], selected: [], savedAt: Date.now() - 60000 });
    storageMock.setItem('test_state', old);
    expect(service.load()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// TypesService
// ---------------------------------------------------------------------------

describe('TypesService', () => {
  let service: TypesService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TypesService] });
    service = TestBed.inject(TypesService);
    service.register({
      default: { icon: 'fa fa-file' },
      folder: { icon: 'fa fa-folder', valid_children: ['file', 'folder'], max_children: 5 },
      file: { valid_children: [] },
    });
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('canHaveChild returns true for valid children', () =>
    expect(service.canHaveChild('folder', 'file')).toBeTrue());

  it('canHaveChild returns false for invalid children', () =>
    expect(service.canHaveChild('file', 'folder')).toBeFalse());

  it('withinMaxChildren respects the limit', () => {
    expect(service.withinMaxChildren('folder', 4)).toBeTrue();
    expect(service.withinMaxChildren('folder', 5)).toBeFalse();
  });

  it('getIcon falls back to type icon', () => {
    const node: JsTreeNode = { text: 'f', type: 'folder' };
    expect(service.getIcon(node)).toBe('fa fa-folder');
  });

  it('getIcon uses node icon if set', () => {
    const node: JsTreeNode = { text: 'x', type: 'folder', icon: 'my-icon' };
    expect(service.getIcon(node)).toBe('my-icon');
  });

  it('default type properties are merged', () => {
    const type = service.getType('file');
    expect(type?.icon).toBe('fa fa-file');
  });
});

// ---------------------------------------------------------------------------
// JstreeSearchPipe
// ---------------------------------------------------------------------------

describe('JstreeSearchPipe', () => {
  const pipe = new JstreeSearchPipe();
  const nodes: JsTreeNode[] = [
    {
      id: 'n1',
      text: 'Alpha',
      children: [
        { id: 'n1c1', text: 'Beta Child' },
        { id: 'n1c2', text: 'Gamma Child' },
      ],
    },
    { id: 'n2', text: 'Delta' },
  ];

  it('returns all nodes for empty query', () =>
    expect(pipe.transform(nodes, '')).toEqual(nodes));

  it('returns all nodes for null query', () =>
    expect(pipe.transform(nodes, null)).toEqual(nodes));

  it('filters top-level nodes by text', () => {
    const result = pipe.transform(nodes, 'Alpha');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('n1');
  });

  it('preserves ancestor nodes when child matches', () => {
    const result = pipe.transform(nodes, 'Beta');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('n1');
  });

  it('opens ancestor nodes of matching children', () => {
    const result = pipe.transform(nodes, 'Beta');
    expect(result[0].state?.opened).toBeTrue();
  });

  it('is case-insensitive by default', () => {
    const result = pipe.transform(nodes, 'alpha');
    expect(result.length).toBe(1);
  });

  it('fuzzy matching works', () => {
    const result = pipe.transform(nodes, 'Aph', { fuzzy: true });
    expect(result.length).toBe(1);
  });

  it('returns empty when no match', () =>
    expect(pipe.transform(nodes, 'ZZZZZ').length).toBe(0));
});

// ---------------------------------------------------------------------------
// MassLoadService (using in-memory map)
// ---------------------------------------------------------------------------

describe('MassLoadService', () => {
  let service: MassLoadService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MassLoadService] });
    service = TestBed.inject(MassLoadService);
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('loadFromMap returns matching children', (done) => {
    const map: Record<string, JsTreeNode[]> = {
      n1: [{ id: 'c1', text: 'C1' }],
      n2: [{ id: 'c2', text: 'C2' }],
    };
    service.loadFromMap(['n1'], map).subscribe((result) => {
      expect(result['n1']).toEqual(map['n1']);
      expect(result['n2']).toBeUndefined();
      done();
    });
  });

  it('loadFromMap returns empty object for empty id list', (done) => {
    service.loadFromMap([], {}).subscribe((result) => {
      expect(result).toEqual({});
      done();
    });
  });
});

// ---------------------------------------------------------------------------
// DndService
// ---------------------------------------------------------------------------

describe('DndService', () => {
  let service: DndService;
  const node: JsTreeNode = { id: 'n1', text: 'N1' };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [DndService] });
    service = TestBed.inject(DndService);
  });

  afterEach(() => service.ngOnDestroy());

  it('should be created', () => expect(service).toBeTruthy());

  it('startDrag sets drag state', () => {
    service.startDrag([node], 'move', 'tree-1');
    expect(service.getDragState()).not.toBeNull();
    expect(service.getDragState()?.isCopy).toBeFalse();
  });

  it('cancelDrag clears drag state', () => {
    service.startDrag([node], 'copy', 'tree-1');
    service.cancelDrag();
    expect(service.getDragState()).toBeNull();
  });

  it('notifyDrop emits drop event and clears state', (done) => {
    service.startDrag([node], 'move', 'tree-1');
    service.drop$.subscribe((r) => {
      expect(r.operation).toBe('move');
      expect(service.getDragState()).toBeNull();
      done();
    });
    service.notifyDrop({
      nodes: [node],
      newParentId: '#',
      newPosition: 0,
      oldParentId: '#',
      operation: 'move',
      sourceId: 'tree-1',
      targetId: 'tree-1',
    });
  });

  it('canDrop returns false when dragging onto itself', () => {
    const state = { nodes: [node], isCopy: false, sourceId: 'tree-1' };
    expect(service.canDrop(state, 'n1', 'tree-1')).toBeFalse();
  });

  it('canDrop returns true for valid target', () => {
    const state = { nodes: [node], isCopy: false, sourceId: 'tree-1' };
    expect(service.canDrop(state, 'other', 'tree-1')).toBeTrue();
  });
});

// ---------------------------------------------------------------------------
// NativeTreeService
// ---------------------------------------------------------------------------

describe('NativeTreeService', () => {
  let service: NativeTreeService;

  const sampleNodes: JsTreeNode[] = [
    {
      id: 'root',
      text: 'Root',
      children: [{ id: 'child1', text: 'Child 1' }],
    },
    { id: 'leaf', text: 'Leaf' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [NativeTreeService] });
    service = TestBed.inject(NativeTreeService);
    service.setNodes(structuredClone(sampleNodes));
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('getNodes() returns current nodes', () =>
    expect(service.getNodes().length).toBe(2));

  it('findNode() finds a deep node', () =>
    expect(service.findNode('child1')?.id).toBe('child1'));

  it('findNode() returns null for missing id', () =>
    expect(service.findNode('missing')).toBeNull());

  it('addNode() adds a child under a parent', () => {
    service.addNode('root', { id: 'child2', text: 'Child 2' });
    const root = service.findNode('root');
    expect((root?.children as JsTreeNode[]).length).toBe(2);
  });

  it('addNode() adds at root level when parent is #', () => {
    service.addNode('#', { id: 'new_root', text: 'New Root' });
    expect(service.getNodes().length).toBe(3);
  });

  it('renameNode() renames a node', () => {
    service.renameNode('leaf', 'Renamed Leaf');
    expect(service.findNode('leaf')?.text).toBe('Renamed Leaf');
  });

  it('removeNode() removes a node', () => {
    service.removeNode('leaf');
    expect(service.findNode('leaf')).toBeNull();
    expect(service.getNodes().length).toBe(1);
  });

  it('selectNode() selects a node', () => {
    service.selectNode('leaf');
    expect(service.getSelected().has('leaf')).toBeTrue();
  });

  it('selectNode() replaces selection by default', () => {
    service.selectNode('leaf');
    service.selectNode('root');
    expect(service.getSelected().size).toBe(1);
  });

  it('selectNode() adds to selection in multi mode', () => {
    service.selectNode('leaf');
    service.selectNode('root', true);
    expect(service.getSelected().size).toBe(2);
  });

  it('deselectNode() removes a node from selection', () => {
    service.selectNode('leaf');
    service.deselectNode('leaf');
    expect(service.getSelected().has('leaf')).toBeFalse();
  });

  it('deselectAll() clears selection', () => {
    service.selectNode('leaf');
    service.deselectAll();
    expect(service.getSelected().size).toBe(0);
  });
});
