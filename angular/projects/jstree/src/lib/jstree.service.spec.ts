import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { JstreeService } from './jstree.service';

// ---------------------------------------------------------------------------
// jQuery stub (re-uses pattern from jstree.component.spec)
// ---------------------------------------------------------------------------

const instanceMethods: Record<string, jasmine.Spy> = {
  get_node:      jasmine.createSpy('get_node').and.returnValue({ id: 'a', text: 'A' }),
  get_selected:  jasmine.createSpy('get_selected').and.returnValue(['a']),
  get_checked:   jasmine.createSpy('get_checked').and.returnValue(['a']),
  get_undetermined: jasmine.createSpy('get_undetermined').and.returnValue([]),
  select_node:   jasmine.createSpy('select_node'),
  deselect_node: jasmine.createSpy('deselect_node'),
  deselect_all:  jasmine.createSpy('deselect_all'),
  select_all:    jasmine.createSpy('select_all'),
  open_node:     jasmine.createSpy('open_node'),
  close_node:    jasmine.createSpy('close_node'),
  toggle_node:   jasmine.createSpy('toggle_node'),
  open_all:      jasmine.createSpy('open_all'),
  close_all:     jasmine.createSpy('close_all'),
  create_node:   jasmine.createSpy('create_node').and.returnValue('new_id'),
  rename_node:   jasmine.createSpy('rename_node'),
  delete_node:   jasmine.createSpy('delete_node'),
  move_node:     jasmine.createSpy('move_node'),
  copy_node:     jasmine.createSpy('copy_node'),
  refresh:       jasmine.createSpy('refresh'),
  refresh_node:  jasmine.createSpy('refresh_node'),
  load_node:     jasmine.createSpy('load_node'),
  search:        jasmine.createSpy('search'),
  clear_search:  jasmine.createSpy('clear_search'),
  show_checkboxes:   jasmine.createSpy('show_checkboxes'),
  hide_checkboxes:   jasmine.createSpy('hide_checkboxes'),
  toggle_checkboxes: jasmine.createSpy('toggle_checkboxes'),
  get_path: jasmine.createSpy('get_path').and.returnValue(['Root', 'A']),
};

const jqueryChain = {
  jstree: (method: unknown) => {
    if (method === true) {
      return instanceMethods;
    }
    if (typeof method === 'string') {
      const fn = instanceMethods[method];
      if (fn) {
        const rest = Array.from(arguments).slice(1);
        return fn(...rest);
      }
    }
    return jqueryChain;
  },
};

(window as unknown as Record<string, unknown>)['$'] = (_el: unknown) => jqueryChain;

describe('JstreeService', () => {
  let service: JstreeService;
  let mockEl: ElementRef<HTMLElement>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [JstreeService] });
    service = TestBed.inject(JstreeService);
    mockEl = new ElementRef(document.createElement('div'));
    // Reset spy call counts
    Object.values(instanceMethods).forEach((spy) => (spy as jasmine.Spy).calls.reset());
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getInstance() returns instance', () => {
    const inst = service.getInstance(mockEl);
    expect(inst).toBeDefined();
  });

  it('getNode() delegates', () => {
    const node = service.getNode(mockEl, 'a');
    expect(instanceMethods['get_node']).toHaveBeenCalledWith('a');
    expect(node).toEqual({ id: 'a', text: 'A' });
  });

  it('getSelected() delegates', () => {
    const sel = service.getSelected(mockEl);
    expect(instanceMethods['get_selected']).toHaveBeenCalledWith(false);
    expect(sel).toEqual(['a']);
  });

  it('getCheckedNodes() delegates', () => {
    service.getCheckedNodes(mockEl);
    expect(instanceMethods['get_checked']).toHaveBeenCalled();
  });

  it('selectNode() delegates', () => {
    service.selectNode(mockEl, 'a');
    expect(instanceMethods['select_node']).toHaveBeenCalledWith('a', false);
  });

  it('deselectNode() delegates', () => {
    service.deselectNode(mockEl, 'a');
    expect(instanceMethods['deselect_node']).toHaveBeenCalledWith('a', false);
  });

  it('deselectAll() delegates', () => {
    service.deselectAll(mockEl);
    expect(instanceMethods['deselect_all']).toHaveBeenCalled();
  });

  it('openNode() delegates', () => {
    service.openNode(mockEl, 'a');
    expect(instanceMethods['open_node']).toHaveBeenCalledWith('a', undefined);
  });

  it('closeNode() delegates', () => {
    service.closeNode(mockEl, 'a');
    expect(instanceMethods['close_node']).toHaveBeenCalledWith('a', undefined);
  });

  it('createNode() returns new id', () => {
    const id = service.createNode(mockEl, '#', { text: 'New' });
    expect(id).toBe('new_id');
  });

  it('renameNode() delegates', () => {
    service.renameNode(mockEl, 'a', 'B');
    expect(instanceMethods['rename_node']).toHaveBeenCalledWith('a', 'B');
  });

  it('deleteNode() delegates', () => {
    service.deleteNode(mockEl, 'a');
    expect(instanceMethods['delete_node']).toHaveBeenCalledWith('a');
  });

  it('moveNode() delegates', () => {
    service.moveNode(mockEl, 'a', '#');
    expect(instanceMethods['move_node']).toHaveBeenCalledWith('a', '#', 'last');
  });

  it('copyNode() delegates', () => {
    service.copyNode(mockEl, 'a', '#');
    expect(instanceMethods['copy_node']).toHaveBeenCalledWith('a', '#', 'last');
  });

  it('refresh() delegates', () => {
    service.refresh(mockEl);
    expect(instanceMethods['refresh']).toHaveBeenCalledWith(false, false);
  });

  it('search() delegates', () => {
    service.search(mockEl, 'query');
    expect(instanceMethods['search']).toHaveBeenCalledWith('query');
  });

  it('clearSearch() delegates', () => {
    service.clearSearch(mockEl);
    expect(instanceMethods['clear_search']).toHaveBeenCalled();
  });

  it('showCheckboxes() delegates', () => {
    service.showCheckboxes(mockEl);
    expect(instanceMethods['show_checkboxes']).toHaveBeenCalled();
  });

  it('hideCheckboxes() delegates', () => {
    service.hideCheckboxes(mockEl);
    expect(instanceMethods['hide_checkboxes']).toHaveBeenCalled();
  });

  it('accepts raw HTMLElement (not ElementRef)', () => {
    const el = document.createElement('div');
    expect(() => service.getInstance(el)).not.toThrow();
  });
});
