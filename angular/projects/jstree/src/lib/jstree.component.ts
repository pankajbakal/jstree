import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  JsTreeChangedEvent,
  JsTreeConfig,
  JsTreeMoveEvent,
  JsTreeNode,
  JsTreeNodeEvent,
  JsTreeRenameEvent,
} from './jstree.models';

declare const $: any; // jQuery injected via global script

/**
 * ## JstreeComponent  (Strategy A – jQuery wrapper)
 *
 * Wraps the existing jQuery jsTree plugin inside an Angular component so that
 * it can be used in any Angular application without rewriting the plugin.
 *
 * ### Usage
 * ```html
 * <jstree-tree
 *   [config]="treeConfig"
 *   [data]="treeData"
 *   [plugins]="['checkbox', 'search']"
 *   (selectNode)="onSelect($event)"
 *   (changed)="onChanged($event)"
 * ></jstree-tree>
 * ```
 *
 * ### Inputs
 * | Name      | Type                        | Description                          |
 * |-----------|-----------------------------|--------------------------------------|
 * | `config`  | `JsTreeConfig`              | Full jstree options object           |
 * | `data`    | `JsTreeNode[] \| string`    | Override `core.data` shorthand       |
 * | `plugins` | `string[]`                  | Override the `plugins` array         |
 *
 * ### Outputs
 * All standard jstree events are forwarded as Angular `EventEmitter`s.
 */
@Component({
  selector: 'jstree-tree',
  template: '<div #treeContainer></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JstreeComponent implements AfterViewInit, OnChanges, OnDestroy {
  // ------------------------------------------------------------------
  // Inputs
  // ------------------------------------------------------------------

  /** Complete jstree options object.  Merged with `data` / `plugins` inputs. */
  @Input() config: JsTreeConfig = {};

  /**
   * Convenience shorthand for `config.core.data`.  When set, it overrides
   * whatever value `config.core.data` has.
   */
  @Input() data: JsTreeNode[] | string | null = null;

  /**
   * Convenience shorthand for `config.plugins`.  When set, it overrides
   * whatever value `config.plugins` has.
   */
  @Input() plugins: string[] | null = null;

  // ------------------------------------------------------------------
  // Outputs – one EventEmitter per jstree event namespace
  // ------------------------------------------------------------------

  /** Fired after the tree has been fully loaded and rendered. */
  @Output() ready = new EventEmitter<JsTreeEventBase>();

  /** Fired when a node is loaded. */
  @Output() loaded = new EventEmitter<JsTreeNodeEvent>();

  /** Fired when a node is selected. */
  @Output() selectNode = new EventEmitter<JsTreeNodeEvent>();

  /** Fired when a node is deselected. */
  @Output() deselectNode = new EventEmitter<JsTreeNodeEvent>();

  /** Fired when all nodes are selected. */
  @Output() selectAll = new EventEmitter<JsTreeEventBase>();

  /** Fired when all nodes are deselected. */
  @Output() deselectAll = new EventEmitter<JsTreeEventBase>();

  /** Fired when the selection changes (combines all selection events). */
  @Output() changed = new EventEmitter<JsTreeChangedEvent>();

  /** Fired when a node is opened (expanded). */
  @Output() openNode = new EventEmitter<JsTreeNodeEvent>();

  /** Fired after a node has fully opened. */
  @Output() afterOpen = new EventEmitter<JsTreeNodeEvent>();

  /** Fired when a node is closed (collapsed). */
  @Output() closeNode = new EventEmitter<JsTreeNodeEvent>();

  /** Fired after a node has fully closed. */
  @Output() afterClose = new EventEmitter<JsTreeNodeEvent>();

  /** Fired when a node is created. */
  @Output() createNode = new EventEmitter<JsTreeNodeEvent>();

  /** Fired when a node is renamed. */
  @Output() renameNode = new EventEmitter<JsTreeRenameEvent>();

  /** Fired when a node is deleted. */
  @Output() deleteNode = new EventEmitter<JsTreeNodeEvent>();

  /** Fired when a node is moved. */
  @Output() moveNode = new EventEmitter<JsTreeMoveEvent>();

  /** Fired when a node is copied. */
  @Output() copyNode = new EventEmitter<JsTreeMoveEvent>();

  /** Fired when nodes are cut to the clipboard. */
  @Output() cut = new EventEmitter<JsTreeClipboardEvent>();

  /** Fired when nodes are copied to the clipboard. */
  @Output() copy = new EventEmitter<JsTreeClipboardEvent>();

  /** Fired when nodes are pasted from the clipboard. */
  @Output() paste = new EventEmitter<JsTreePasteEvent>();

  /** Fired when a node is checked (checkbox plugin). */
  @Output() checkNode = new EventEmitter<JsTreeNodeEvent>();

  /** Fired when a node is unchecked (checkbox plugin). */
  @Output() uncheckNode = new EventEmitter<JsTreeNodeEvent>();

  /** Fired when a search is performed (search plugin). */
  @Output() searchEvent = new EventEmitter<JsTreeSearchEventData>();

  /** Fired when the search is cleared (search plugin). */
  @Output() clearSearch = new EventEmitter<JsTreeSearchEventData>();

  // ------------------------------------------------------------------
  // Private state
  // ------------------------------------------------------------------

  private _initialized = false;

  constructor(
    private readonly _el: ElementRef<HTMLElement>,
    private readonly _zone: NgZone
  ) {}

  // ------------------------------------------------------------------
  // Lifecycle hooks
  // ------------------------------------------------------------------

  ngAfterViewInit(): void {
    this._initTree();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this._initialized) {
      return;
    }
    if (changes['config'] || changes['data'] || changes['plugins']) {
      this._destroyTree();
      this._initTree();
    }
  }

  ngOnDestroy(): void {
    this._destroyTree();
  }

  // ------------------------------------------------------------------
  // Public API – wraps common jstree instance methods
  // ------------------------------------------------------------------

  /** Returns the underlying jstree instance. */
  getInstance(): unknown {
    return $(this._treeEl).jstree(true);
  }

  /** Refresh (reload) the whole tree. */
  refresh(skipLoading = false, forgetState = false): void {
    $(this._treeEl).jstree('refresh', skipLoading, forgetState);
  }

  /** Open a node by ID. */
  openNode(nodeId: string, callback?: () => void): void {
    $(this._treeEl).jstree('open_node', nodeId, callback);
  }

  /** Close a node by ID. */
  closeNode(nodeId: string, callback?: () => void): void {
    $(this._treeEl).jstree('close_node', nodeId, callback);
  }

  /** Toggle a node by ID. */
  toggleNode(nodeId: string): void {
    $(this._treeEl).jstree('toggle_node', nodeId);
  }

  /** Open all nodes. */
  openAll(nodeId?: string, animation?: number): void {
    $(this._treeEl).jstree('open_all', nodeId, animation);
  }

  /** Close all nodes. */
  closeAll(nodeId?: string, animation?: number): void {
    $(this._treeEl).jstree('close_all', nodeId, animation);
  }

  /** Select a node by ID. */
  selectNode(nodeId: string, suppressEvent = false): void {
    $(this._treeEl).jstree('select_node', nodeId, suppressEvent);
  }

  /** Deselect a node by ID. */
  deselectNode(nodeId: string, suppressEvent = false): void {
    $(this._treeEl).jstree('deselect_node', nodeId, suppressEvent);
  }

  /** Deselect all nodes. */
  deselectAll(suppressEvent = false): void {
    $(this._treeEl).jstree('deselect_all', suppressEvent);
  }

  /** Returns the IDs of all currently selected nodes. */
  getSelected(full = false): string[] {
    return $(this._treeEl).jstree('get_selected', full);
  }

  /** Returns a node object by ID. */
  getNode(nodeId: string): JsTreeNode | false {
    return $(this._treeEl).jstree('get_node', nodeId);
  }

  /** Create a new node. Returns the new node ID or false. */
  createNode(
    parentId: string,
    node: Partial<JsTreeNode>,
    position: 'last' | 'first' | number = 'last',
    callback?: (node: JsTreeNode) => void
  ): string | false {
    return $(this._treeEl).jstree('create_node', parentId, node, position, callback);
  }

  /** Rename a node. */
  renameNode(nodeId: string, text: string): void {
    $(this._treeEl).jstree('rename_node', nodeId, text);
  }

  /** Delete a node by ID. */
  deleteNode(nodeId: string): void {
    $(this._treeEl).jstree('delete_node', nodeId);
  }

  /** Get the path to a node as an array (of text labels by default). */
  getPath(nodeId: string, glue?: string, ids = false): string[] | string {
    return $(this._treeEl).jstree('get_path', nodeId, glue, ids);
  }

  /** Programmatically trigger a search (requires the `search` plugin). */
  search(str: string): void {
    $(this._treeEl).jstree('search', str);
  }

  /** Clear an active search (requires the `search` plugin). */
  clearSearchResults(): void {
    $(this._treeEl).jstree('clear_search');
  }

  // ------------------------------------------------------------------
  // Private helpers
  // ------------------------------------------------------------------

  private get _treeEl(): HTMLElement {
    return this._el.nativeElement.querySelector('div') as HTMLElement;
  }

  private _buildConfig(): JsTreeConfig {
    const merged: JsTreeConfig = { ...this.config };
    if (this.plugins !== null) {
      merged.plugins = this.plugins;
    }
    if (this.data !== null) {
      merged.core = { ...merged.core, data: this.data as JsTreeNode[] };
    }
    return merged;
  }

  private _initTree(): void {
    if (typeof $ === 'undefined' || typeof $.fn?.jstree === 'undefined') {
      console.error(
        '[JstreeComponent] jQuery and/or jstree are not available. ' +
          'Make sure jquery and jstree scripts are loaded before Angular bootstraps.'
      );
      return;
    }

    // Run jQuery outside Angular's change detection to avoid performance issues.
    this._zone.runOutsideAngular(() => {
      const cfg = this._buildConfig();
      $(this._treeEl).jstree(cfg);
      this._bindEvents();
    });

    this._initialized = true;
  }

  private _destroyTree(): void {
    if (!this._initialized) {
      return;
    }
    try {
      $(this._treeEl).jstree('destroy');
    } catch {
      // Guard against destroy being called on an already-destroyed instance.
    }
    this._initialized = false;
  }

  /** Bind all jstree DOM events and re-enter Angular zone before emitting. */
  private _bindEvents(): void {
    const el = this._treeEl;

    const emit = <T>(emitter: EventEmitter<T>, data: T) =>
      this._zone.run(() => emitter.emit(data));

    $(el)
      .on('ready.jstree', (_e: Event, data: unknown) =>
        emit(this.ready, data as JsTreeEventBase)
      )
      .on('loaded.jstree', (_e: Event, data: unknown) =>
        emit(this.loaded, data as JsTreeNodeEvent)
      )
      .on('changed.jstree', (_e: Event, data: unknown) =>
        emit(this.changed, data as JsTreeChangedEvent)
      )
      .on('select_node.jstree', (_e: Event, data: unknown) =>
        emit(this.selectNode, data as JsTreeNodeEvent)
      )
      .on('deselect_node.jstree', (_e: Event, data: unknown) =>
        emit(this.deselectNode, data as JsTreeNodeEvent)
      )
      .on('select_all.jstree', (_e: Event, data: unknown) =>
        emit(this.selectAll, data as JsTreeEventBase)
      )
      .on('deselect_all.jstree', (_e: Event, data: unknown) =>
        emit(this.deselectAll, data as JsTreeEventBase)
      )
      .on('open_node.jstree', (_e: Event, data: unknown) =>
        emit(this.openNode, data as JsTreeNodeEvent)
      )
      .on('after_open.jstree', (_e: Event, data: unknown) =>
        emit(this.afterOpen, data as JsTreeNodeEvent)
      )
      .on('close_node.jstree', (_e: Event, data: unknown) =>
        emit(this.closeNode, data as JsTreeNodeEvent)
      )
      .on('after_close.jstree', (_e: Event, data: unknown) =>
        emit(this.afterClose, data as JsTreeNodeEvent)
      )
      .on('create_node.jstree', (_e: Event, data: unknown) =>
        emit(this.createNode, data as JsTreeNodeEvent)
      )
      .on('rename_node.jstree', (_e: Event, data: unknown) =>
        emit(this.renameNode, data as JsTreeRenameEvent)
      )
      .on('delete_node.jstree', (_e: Event, data: unknown) =>
        emit(this.deleteNode, data as JsTreeNodeEvent)
      )
      .on('move_node.jstree', (_e: Event, data: unknown) =>
        emit(this.moveNode, data as JsTreeMoveEvent)
      )
      .on('copy_node.jstree', (_e: Event, data: unknown) =>
        emit(this.copyNode, data as JsTreeMoveEvent)
      )
      .on('cut.jstree', (_e: Event, data: unknown) =>
        emit(this.cut, data as JsTreeClipboardEvent)
      )
      .on('copy.jstree', (_e: Event, data: unknown) =>
        emit(this.copy, data as JsTreeClipboardEvent)
      )
      .on('paste.jstree', (_e: Event, data: unknown) =>
        emit(this.paste, data as JsTreePasteEvent)
      )
      .on('check_node.jstree', (_e: Event, data: unknown) =>
        emit(this.checkNode, data as JsTreeNodeEvent)
      )
      .on('uncheck_node.jstree', (_e: Event, data: unknown) =>
        emit(this.uncheckNode, data as JsTreeNodeEvent)
      )
      .on('search.jstree', (_e: Event, data: unknown) =>
        emit(this.searchEvent, data as JsTreeSearchEventData)
      )
      .on('clear_search.jstree', (_e: Event, data: unknown) =>
        emit(this.clearSearch, data as JsTreeSearchEventData)
      );
  }
}

// ---------------------------------------------------------------------------
// Additional event-payload types (kept in the component file for brevity)
// ---------------------------------------------------------------------------

/** Minimal payload with just the jstree instance reference. */
export interface JsTreeEventBase {
  instance: unknown;
}

/** Payload for clipboard events (cut/copy). */
export interface JsTreeClipboardEvent extends JsTreeEventBase {
  node: JsTreeNode[];
}

/** Payload for paste events. */
export interface JsTreePasteEvent extends JsTreeEventBase {
  parent: string;
  node: JsTreeNode[];
  mode: 'move_node' | 'copy_node';
}

/** Payload for search / clear_search events. */
export interface JsTreeSearchEventData extends JsTreeEventBase {
  nodes: unknown; // jQuery result set
  str: string;
  res: string[];
  show_only_matches: boolean;
}
