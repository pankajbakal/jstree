import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ChangeDetectionStrategy, Component, NgZone } from '@angular/core';

import { JstreeComponent } from './jstree.component';
import { JsTreeConfig, JsTreeNode } from './jstree.models';

// ---------------------------------------------------------------------------
// jQuery / jstree stub
// ---------------------------------------------------------------------------

/** Minimal stub for the jQuery object returned by $(el).jstree(...). */
interface JstreeStub {
  [key: string]: unknown;
}

const stubInstance: JstreeStub = {
  get_selected: jasmine.createSpy('get_selected').and.returnValue(['node_1']),
  get_node: jasmine.createSpy('get_node').and.returnValue({ id: 'node_1', text: 'Node 1' }),
  open_node: jasmine.createSpy('open_node'),
  close_node: jasmine.createSpy('close_node'),
  select_node: jasmine.createSpy('select_node'),
  deselect_node: jasmine.createSpy('deselect_node'),
  deselect_all: jasmine.createSpy('deselect_all'),
  create_node: jasmine.createSpy('create_node').and.returnValue('new_id'),
  rename_node: jasmine.createSpy('rename_node'),
  delete_node: jasmine.createSpy('delete_node'),
  refresh: jasmine.createSpy('refresh'),
  search: jasmine.createSpy('search'),
  destroy: jasmine.createSpy('destroy'),
};

/** Event callbacks registered via .on() so tests can trigger them. */
const eventHandlers: Record<string, Function> = {};

const jqueryFn = jasmine.createSpy('$fn.jstree').and.callFake(function(this: unknown, arg: unknown, ...rest: unknown[]) {
  if (arg === true) {
    return stubInstance;
  }
  if (typeof arg === 'string') {
    const method = arg as string;
    if (method in stubInstance) {
      return (stubInstance[method] as (...a: unknown[]) => unknown)(...rest);
    }
    return undefined;
  }
  // Construction call – return the jQuery chain object
  return mockJqueryChain;
});

const mockJqueryChain = {
  jstree: jqueryFn,
  on: (event: string, handler: Function) => {
    eventHandlers[event] = handler;
    return mockJqueryChain;
  },
  off: () => mockJqueryChain,
};

// Create the mock `$` function with `.fn.jstree` attached.
const mockJQueryFactory = Object.assign(
  (el: unknown) => { void el; return mockJqueryChain; },
  { fn: { jstree: jqueryFn } }
);

// ---------------------------------------------------------------------------
// JstreeComponent tests
// ---------------------------------------------------------------------------

describe('JstreeComponent', () => {
  let component: JstreeComponent;
  let fixture: ComponentFixture<JstreeComponent>;

  const sampleData: JsTreeNode[] = [
    {
      id: 'node_1',
      text: 'Node 1',
      children: [{ id: 'child_1', text: 'Child 1' }],
    },
    { id: 'node_2', text: 'Node 2' },
  ];

  const sampleConfig: JsTreeConfig = {
    core: { data: sampleData },
    plugins: ['checkbox'],
  };

  beforeEach(async () => {
    // Re-install mock before each test to avoid cross-spec contamination.
    (window as unknown as Record<string, unknown>)['$'] = mockJQueryFactory;

    await TestBed.configureTestingModule({
      declarations: [JstreeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(JstreeComponent);
    component = fixture.componentInstance;
    component.config = sampleConfig;
    component.data = sampleData;
  });

  afterEach(() => {
    jqueryFn.calls.reset();
    (stubInstance['destroy'] as jasmine.Spy).calls.reset();
    (stubInstance['refresh'] as jasmine.Spy).calls.reset();
    Object.keys(eventHandlers).forEach((k) => delete eventHandlers[k]);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialise jstree after view init', () => {
    fixture.detectChanges(); // triggers ngAfterViewInit
    expect(jqueryFn).toHaveBeenCalled();
  });

  it('should destroy jstree on component destroy', () => {
    fixture.detectChanges();
    fixture.destroy();
    expect(stubInstance['destroy']).toHaveBeenCalled();
  });

  it('should reinitialise when config input changes', () => {
    fixture.detectChanges();
    const callsBefore = jqueryFn.calls.count();
    component.config = { ...sampleConfig, plugins: ['search'] };
    component.ngOnChanges({
      config: {
        currentValue: component.config,
        previousValue: sampleConfig,
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    expect(jqueryFn.calls.count()).toBeGreaterThan(callsBefore);
  });

  it('should merge data input into core.data', () => {
    const customData: JsTreeNode[] = [{ id: 'x', text: 'X' }];
    component.data = customData;
    fixture.detectChanges();
    // jstree was called – verify it was called with a config including our data
    expect(jqueryFn).toHaveBeenCalled();
  });

  it('should merge plugins input', () => {
    component.plugins = ['dnd', 'search'];
    fixture.detectChanges();
    expect(jqueryFn).toHaveBeenCalled();
  });

  it('should emit selectNode event when select_node.jstree fires', fakeAsync(() => {
    fixture.detectChanges();
    const node: JsTreeNode = { id: 'node_1', text: 'Node 1' };
    let emitted: unknown;
    component.selectNode.subscribe((e) => (emitted = e));

    if (eventHandlers['select_node.jstree']) {
      const zone = TestBed.inject(NgZone);
      zone.run(() =>
        eventHandlers['select_node.jstree']({} as Event, { node, instance: {} })
      );
    }

    tick();
    expect(emitted).toBeDefined();
  }));

  it('should emit changed event when changed.jstree fires', fakeAsync(() => {
    fixture.detectChanges();
    let emitted: unknown;
    component.changed.subscribe((e) => (emitted = e));

    const payload = {
      node: sampleData[0],
      action: 'select_node',
      selected: ['node_1'],
      changed: { selected: [sampleData[0]], deselected: [] },
      instance: {},
    };

    if (eventHandlers['changed.jstree']) {
      const zone = TestBed.inject(NgZone);
      zone.run(() =>
        eventHandlers['changed.jstree']({} as Event, payload)
      );
    }

    tick();
    expect(emitted).toEqual(payload);
  }));

  // ------------------------------------------------------------------
  // Public method delegation tests
  // ------------------------------------------------------------------

  it('getInstance() should return the jstree instance', () => {
    fixture.detectChanges();
    const inst = component.getInstance();
    expect(inst).toBeDefined();
  });

  it('getSelected() should delegate to jstree get_selected', () => {
    fixture.detectChanges();
    const selected = component.getSelected();
    expect(selected).toEqual(['node_1']);
  });

  it('getNode() should delegate to jstree get_node', () => {
    fixture.detectChanges();
    const node = component.getNode('node_1');
    expect(node).toBeTruthy();
  });

  it('addNode() should delegate to jstree create_node', () => {
    fixture.detectChanges();
    const id = component.addNode('#', { text: 'New' });
    expect(id).toEqual('new_id');
  });

  it('rename() should delegate to jstree rename_node', () => {
    fixture.detectChanges();
    component.rename('node_1', 'Renamed');
    expect(stubInstance['rename_node']).toHaveBeenCalledWith('node_1', 'Renamed');
  });

  it('remove() should delegate to jstree delete_node', () => {
    fixture.detectChanges();
    component.remove('node_1');
    expect(stubInstance['delete_node']).toHaveBeenCalledWith('node_1');
  });
});

// ---------------------------------------------------------------------------
// Wrapper component for host-binding scenarios
// ---------------------------------------------------------------------------

@Component({
  template: `
    <jstree-tree
      [config]="cfg"
      [plugins]="plugs"
      (selectNode)="onSelect($event)"
    ></jstree-tree>
  `,
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: false,
})
class TestHostComponent {
  cfg: JsTreeConfig = { plugins: ['checkbox'] };
  plugs: string[] | null = null;
  lastSelected: unknown = null;
  onSelect(e: unknown): void { this.lastSelected = e; }
}

describe('JstreeComponent (host)', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    // Re-install mock before each test.
    (window as unknown as Record<string, unknown>)['$'] = mockJQueryFactory;

    await TestBed.configureTestingModule({
      declarations: [JstreeComponent, TestHostComponent],
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
  });

  it('should render inside a host component', () => {
    hostFixture.detectChanges();
    const el = hostFixture.nativeElement as HTMLElement;
    expect(el.querySelector('jstree-tree')).toBeTruthy();
  });
});
