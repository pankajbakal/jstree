import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  ],
  imports: [CommonModule],
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
  ],
  providers: [
    JstreeService,
  ],
})
export class JstreeModule {}
