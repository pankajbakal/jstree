import {
  Directive,
  ElementRef,
  HostBinding,
  Input,
  OnChanges,
  Renderer2,
  SimpleChanges,
} from '@angular/core';

/**
 * ## WholerowDirective  (Strategy B – replaces `jstree.wholerow.js`)
 *
 * Makes the entire row of a tree node a click / hover target by adding a
 * full-width background layer behind the node anchor.  Attach to a
 * `<jstree-native-node>` host element.
 *
 * ### Usage
 * ```html
 * <jstree-native-node jsTreeWholerow [wholerowEnabled]="true"></jstree-native-node>
 * ```
 */
@Directive({
  selector: '[jsTreeWholerow]',
})
export class WholerowDirective implements OnChanges {
  /** Enable or disable the whole-row highlight. Default: true. */
  @Input() wholerowEnabled = true;

  @HostBinding('class.jstree-wholerow-ul') get hasClass(): boolean {
    return this.wholerowEnabled;
  }

  private _wholerowEl: HTMLElement | null = null;

  constructor(
    private readonly _el: ElementRef<HTMLElement>,
    private readonly _renderer: Renderer2
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['wholerowEnabled']) {
      this.wholerowEnabled ? this._addWholerow() : this._removeWholerow();
    }
  }

  // ------------------------------------------------------------------
  // Private helpers
  // ------------------------------------------------------------------

  private _addWholerow(): void {
    if (this._wholerowEl) {
      return;
    }
    const div = this._renderer.createElement('i') as HTMLElement;
    this._renderer.addClass(div, 'jstree-wholerow');
    this._renderer.setAttribute(div, 'role', 'presentation');
    // Insert as the first child of the host element
    const firstChild = this._el.nativeElement.firstChild;
    if (firstChild) {
      this._renderer.insertBefore(this._el.nativeElement, div, firstChild);
    } else {
      this._renderer.appendChild(this._el.nativeElement, div);
    }
    this._wholerowEl = div;
  }

  private _removeWholerow(): void {
    if (this._wholerowEl) {
      this._renderer.removeChild(this._el.nativeElement, this._wholerowEl);
      this._wholerowEl = null;
    }
  }
}
