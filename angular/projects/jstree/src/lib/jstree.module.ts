import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';

import { JstreeComponent } from './jstree.component';
import { JstreeService } from './jstree.service';

// Native Angular (Strategy B) exports
import { NativeTreeComponent } from './native-tree/native-tree.component';
import { NativeTreeNodeComponent } from './native-tree/native-tree-node.component';
import { CheckboxDirective } from './plugins/checkbox.directive';
import { WholerowDirective } from './plugins/wholerow.directive';
import { ContextmenuDirective } from './plugins/contextmenu.directive';
import { ConditionalSelectDirective } from './plugins/conditionalselect.directive';
import { JstreeSearchPipe } from './plugins/search.pipe';
import { FlattenTreePipe } from './plugins/flatten-tree.pipe';

/**
 * ## JstreeModule
 *
 * Import this module into any Angular feature module to use the jsTree
 * Angular components and directives.
 *
 * ### Strategy A (jQuery wrapper) – `<jstree-tree>`
 * Requires jQuery and jsTree scripts to be loaded globally (see README).
 *
 * ### Strategy B (native Angular) – `<jstree-native-tree>`
 * Pure Angular, no jQuery dependency.
 *
 * ```typescript
 * @NgModule({
 *   imports: [JstreeModule],
 *   ...
 * })
 * export class AppModule {}
 * ```
 */
@NgModule({
  declarations: [
    // Strategy A
    JstreeComponent,
    // Strategy B
    NativeTreeComponent,
    NativeTreeNodeComponent,
    CheckboxDirective,
    WholerowDirective,
    ContextmenuDirective,
    ConditionalSelectDirective,
    JstreeSearchPipe,
    FlattenTreePipe,
  ],
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    DragDropModule,
    OverlayModule,
  ],
  exports: [
    // Strategy A
    JstreeComponent,
    // Strategy B
    NativeTreeComponent,
    NativeTreeNodeComponent,
    CheckboxDirective,
    WholerowDirective,
    ContextmenuDirective,
    ConditionalSelectDirective,
    JstreeSearchPipe,
    FlattenTreePipe,
    // CDK re-exports so consumers can use them without adding their own imports
    DragDropModule,
    OverlayModule,
  ],
  providers: [
    JstreeService,
  ],
})
export class JstreeModule {}
