/**
 * TypeScript interfaces and types for the Angular jsTree library.
 * These cover both the Strategy-A jQuery-wrapper and the Strategy-B
 * native Angular component.
 */

// ---------------------------------------------------------------------------
// Core node / data models
// ---------------------------------------------------------------------------

/** State flags that can be set on an individual node. */
export interface JsTreeNodeState {
  /** Whether the node is open (children visible). Default: false. */
  opened?: boolean;
  /** Whether the node is disabled (not selectable/draggable). Default: false. */
  disabled?: boolean;
  /** Whether the node is selected. Default: false. */
  selected?: boolean;
  /** Whether the node has been loaded from a remote source. */
  loaded?: boolean;
}

/** A single tree node as expected by the jstree core. */
export interface JsTreeNode {
  /** Unique identifier for the node. Auto-generated if omitted. */
  id?: string;
  /** Display text for the node (supports HTML). */
  text: string;
  /** Icon for the node: a CSS class string, an image path, or false to hide. */
  icon?: string | boolean;
  /** Initial state flags. */
  state?: JsTreeNodeState;
  /**
   * Children nodes.  Use `true` to mark a node as having children that have
   * not been loaded yet (lazy-load).
   */
  children?: JsTreeNode[] | boolean;
  /** HTML attributes applied to the resulting `<li>` element. */
  li_attr?: Record<string, string>;
  /** HTML attributes applied to the resulting `<a>` element. */
  a_attr?: Record<string, string>;
  /** Node type (must exist in the `types` plugin config). */
  type?: string;
  /** Arbitrary user data attached to the node. */
  data?: unknown;
}

// ---------------------------------------------------------------------------
// Plugin option interfaces
// ---------------------------------------------------------------------------

/** Options for the `checkbox` plugin. */
export interface JsTreeCheckboxConfig {
  /** Show checkboxes. Default: true. */
  visible?: boolean;
  /** Enable tri-state (indeterminate) behaviour. Default: true. */
  three_state?: boolean;
  /** Clicking anywhere on the node acts as clicking the checkbox. Default: true. */
  whole_node?: boolean;
  /**
   * Keep selected state in sync with checkbox state; if false, selection and
   * checked state are independent.  Default: true.
   */
  keep_selected_style?: boolean;
  /** Cascade selection up to the parent. Default: true (with three_state). */
  cascade?: string;
  /** Tie the checkbox to the selection. Default: true. */
  tie_selection?: boolean;
}

/** Options for the `search` plugin. */
export interface JsTreeSearchConfig {
  /** jQuery AJAX config for server-side search.  false = client-side only. */
  ajax?: Record<string, unknown> | false;
  /** Fuzzy search ("chnd3" matches "child node 3"). Default: false. */
  fuzzy?: boolean;
  /** Case-sensitive matching. Default: false. */
  case_sensitive?: boolean;
  /** Filter tree to show only matching nodes. Default: false. */
  show_only_matches?: boolean;
  /** Also show children of matched nodes. Default: false. */
  show_only_matches_children?: boolean;
  /** Close nodes with no matches when filtering. Default: true. */
  close_opened_onclear?: boolean;
  /** Token used to mark matched text. Default: 'jstree-search'. */
  search_leaves_only?: boolean;
}

/** A single type definition used by the `types` plugin. */
export interface JsTreeTypeDefinition {
  /** Max number of immediate children (-1 = unlimited). */
  max_children?: number;
  /** Max nesting depth (-1 = unlimited). */
  max_depth?: number;
  /** Allowed child type names, or -1 for no limit. */
  valid_children?: string[] | number;
  /** Icon for nodes of this type. */
  icon?: string | boolean;
  /** Extra `<li>` attributes. */
  li_attr?: Record<string, string>;
  /** Extra `<a>` attributes. */
  a_attr?: Record<string, string>;
}

/** Options for the `state` plugin. */
export interface JsTreeStateConfig {
  /** localStorage key used to save state. Default: 'jstree'. */
  key?: string;
  /** Space-separated event names that trigger a state save. */
  events?: string;
  /** Time-to-live in milliseconds for stored state. false = no expiry. */
  ttl?: number | false;
  /** Pre-restore filter function. */
  filter?: ((state: unknown) => unknown) | false;
  /** Restore loaded nodes. Default: false. */
  preserve_loaded?: boolean;
}

/** Options for the `dnd` (drag-and-drop) plugin. */
export interface JsTreeDndConfig {
  /** Allow copy on Ctrl/Meta. Default: true. */
  copy?: boolean;
  /** Milliseconds to hover before auto-opening a node. Default: 500. */
  open_timeout?: number;
  /** Callback / boolean to control draggability. Default: true. */
  is_draggable?: boolean | ((nodes: JsTreeNode[], event: Event) => boolean);
  /** Continuously check while dragging. Default: true. */
  check_while_dragging?: boolean;
  /** Allow drop on always-visible nodes. Default: false. */
  always_copy?: boolean;
  /** Inside-margin for reorder (px). Default: 4. */
  inside_pos?: 'first' | 'last' | number;
  /** Drag start threshold (px). Default: 4. */
  drag_selection?: boolean;
  /** Touch drag enable. Default: false. */
  touch?: boolean | 'selected';
  /** Native HTML5 drag. Default: false. */
  large_drag_target?: boolean;
  /** Use large hit areas on mobile. Default: false. */
  large_drop_target?: boolean;
  /** Use HTML5 drag API. Default: false. */
  use_html5?: boolean;
}

/** A single context-menu item definition. */
export interface JsTreeContextMenuItem {
  /** Show a separator before this item. */
  separator_before?: boolean;
  /** Show a separator after this item. */
  separator_after?: boolean;
  /** Disable this item. */
  _disabled?: boolean | ((data: unknown) => boolean);
  /** Display label. */
  label: string | (() => string);
  /** Tooltip text. */
  title?: string;
  /** Action callback invoked when the item is activated. */
  action?: (data: {
    item: JsTreeContextMenuItem;
    reference: Element;
    element: Element;
    position: { x: number; y: number };
  }) => void;
  /** Icon CSS class or image URL. */
  icon?: string;
  /** Shortcut key hint. */
  shortcut?: number;
  /** Shortcut label. */
  shortcut_label?: string;
  /** Nested sub-menu items. */
  submenu?: Record<string, JsTreeContextMenuItem>;
}

/** Options for the `contextmenu` plugin. */
export interface JsTreeContextMenuConfig {
  /** Select node on right-click. Default: true. */
  select_node?: boolean;
  /** Show menu at node position (vs. cursor). Default: true. */
  show_at_node?: boolean;
  /** Static items map or a factory function. */
  items?:
    | Record<string, JsTreeContextMenuItem>
    | ((
        node: JsTreeNode,
        cb: (items: Record<string, JsTreeContextMenuItem>) => void
      ) => Record<string, JsTreeContextMenuItem> | void);
}

/** Options for the `massload` plugin. */
export interface JsTreeMassLoadConfig {
  /** jQuery AJAX config or a function for loading many nodes at once. */
  ajax?:
    | Record<string, unknown>
    | ((
        nodes: string[],
        cb: (data: Record<string, JsTreeNode[]>) => void
      ) => void);
}

// ---------------------------------------------------------------------------
// Core configuration
// ---------------------------------------------------------------------------

/** Options for `core.data` (static array, AJAX config, or function). */
export type JsTreeDataSource =
  | JsTreeNode[]
  | Record<string, unknown>
  | ((
      node: JsTreeNode,
      cb: (children: JsTreeNode[]) => void
    ) => void);

/** Options for core theme configuration. */
export interface JsTreeThemeConfig {
  /** Theme name. Default: 'default'. */
  name?: string;
  /** Path to the theme directory. Auto-detected if omitted. */
  url?: string | false;
  /** Theme variant directory. */
  dir?: string | false;
  /** Show dots. Default: false. */
  dots?: boolean;
  /** Show icons. Default: true. */
  icons?: boolean;
  /** Stripes. Default: false. */
  stripes?: boolean;
  /** Node text overflow behaviour. Default: false. */
  ellipsis?: boolean;
  /** Responsive mode. Default: false. */
  responsive?: boolean;
}

/** Options for the jstree `core` section. */
export interface JsTreeCoreConfig {
  /** Tree data source. */
  data?: JsTreeDataSource;
  /** Allow multiple selection. Default: false. */
  multiple?: boolean;
  /** Expand selected node on load. Default: false. */
  expand_selected_onload?: boolean;
  /** Whether nodes are checkable (relevant with checkbox plugin). */
  worker?: boolean;
  /** Force text output (no HTML in node labels). Default: false. */
  force_text?: boolean;
  /** Focus on a node ID after load. */
  loaded_state?: unknown;
  /** Theme configuration. */
  themes?: JsTreeThemeConfig;
  /** Allow reorder of root nodes. */
  dblclick_toggle?: boolean;
  /** Keyboard navigation. Default: true. */
  keyboard?: Record<string, ((e: Event) => void) | false> | false;
  /** Animation duration (ms) for open/close. Default: 200. */
  animation?: number | false;
  /** Allow HTML in node text.  Use with caution. Default: false. */
  check_callback?:
    | boolean
    | ((
        operation: string,
        node: JsTreeNode,
        nodeParent: JsTreeNode,
        nodePosition: number,
        more?: unknown
      ) => boolean);
  /** Error handler. */
  error?: (err: unknown) => void;
}

/** Full jstree configuration object passed to `$(el).jstree(config)`. */
export interface JsTreeConfig {
  core?: JsTreeCoreConfig;
  plugins?: string[];
  checkbox?: JsTreeCheckboxConfig;
  search?: JsTreeSearchConfig;
  types?: Record<string, JsTreeTypeDefinition>;
  state?: JsTreeStateConfig;
  dnd?: JsTreeDndConfig;
  contextmenu?: JsTreeContextMenuConfig;
  massload?: JsTreeMassLoadConfig;
  sort?: (a: string, b: string) => number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Event payloads emitted by the Angular component
// ---------------------------------------------------------------------------

/** Common payload included in most jstree events. */
export interface JsTreeEventPayload {
  /** The jstree instance. */
  instance: unknown;
  /** The original DOM/jQuery event, if any. */
  event?: Event;
}

/** Payload for node-specific events (select, open, close, etc.). */
export interface JsTreeNodeEvent extends JsTreeEventPayload {
  /** The node that was acted upon. */
  node: JsTreeNode;
}

/** Payload for the `changed` event. */
export interface JsTreeChangedEvent extends JsTreeEventPayload {
  node: JsTreeNode;
  action: string;
  selected: string[];
  changed: {
    selected: JsTreeNode[];
    deselected: JsTreeNode[];
  };
}

/** Payload for rename events. */
export interface JsTreeRenameEvent extends JsTreeEventPayload {
  node: JsTreeNode;
  text: string;
  old: string;
}

/** Payload for move/copy events. */
export interface JsTreeMoveEvent extends JsTreeEventPayload {
  node: JsTreeNode;
  parent: string;
  position: number;
  old_parent: string;
  old_position: number;
  is_multi: boolean;
  is_foreign: boolean;
  old_instance: unknown;
  new_instance: unknown;
}
