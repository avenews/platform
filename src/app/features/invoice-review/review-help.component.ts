import { Component, ElementRef, HostListener, Input, OnDestroy, inject } from '@angular/core'

let nextHelpId = 0
@Component({
  selector: 'app-review-help', standalone: true,
  template: `<button type="button" class="help-button" [attr.aria-label]="'About ' + label"
    [attr.aria-expanded]="open" [attr.aria-describedby]="open ? id : null"
    (mouseenter)="show()" (mouseleave)="leave()" (focus)="show()" (blur)="leave()"
    (click)="toggle($event)">i</button>
    @if (open) { <span class="help-copy" [id]="id" role="tooltip" [style.left.px]="left" [style.top.px]="top">{{ text }}</span> }`,
  styles: [`
    :host{display:inline-flex;vertical-align:middle;margin-inline-start:5px;text-transform:none;letter-spacing:normal}
    .help-button{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:1px solid var(--av-color-surface-border,#d4dbe3);border-radius:50%;background:transparent;color:var(--av-color-text-muted,#66788a);font-family:inherit;font-weight:600;font-size:12px;cursor:pointer}
    .help-button:hover,.help-button:focus-visible{border-color:var(--av-color-primary,#12b4c6);outline:2px solid var(--av-color-primary,#12b4c6);outline-offset:2px}
    .help-copy{position:fixed;z-index:10050;box-sizing:border-box;width:min(300px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;padding:12px 14px;border:1px solid #d4dbe3;border-radius:8px;background:#fff;color:#193540;box-shadow:0 5px 18px #1234;font-size:13px;font-weight:400;line-height:1.5;text-align:left;white-space:normal;pointer-events:none}
    @media(max-width:767px){.help-button{width:34px;height:34px}}
  `],
})
export class ReviewHelpComponent implements OnDestroy {
  @Input() label = 'this value'
  @Input() text = ''
  readonly id = `review-help-${++nextHelpId}`
  private readonly element: ElementRef<HTMLElement> = inject(ElementRef)
  private frame = 0
  open = false
  pinned = false
  left = 12
  top = 12
  show(): void {
    const rect = this.element.nativeElement.getBoundingClientRect()
    this.left = Math.max(12, Math.min(rect.left, window.innerWidth - 312))
    this.top = Math.min(rect.bottom + 8, window.innerHeight - 160)
    this.open = true
    cancelAnimationFrame(this.frame)
    this.frame = requestAnimationFrame(() => {
      const tooltip = this.element.nativeElement.querySelector<HTMLElement>('[role="tooltip"]')
      if (!tooltip || !this.open) return
      const height = tooltip.offsetHeight, width = tooltip.offsetWidth
      const anchor = this.element.nativeElement.getBoundingClientRect()
      this.left = Math.max(12, Math.min(anchor.left, window.innerWidth - width - 12))
      const below = anchor.bottom + 8
      this.top = below + height <= window.innerHeight - 12 ? below : Math.max(12, anchor.top - height - 8)
    })
  }
  leave(): void { if (!this.pinned) this.open = false }
  toggle(event: Event): void { event.stopPropagation(); this.pinned = !this.pinned; this.pinned ? this.show() : this.open = false }
  @HostListener('document:click', ['$event']) outside(event: Event): void {
    if (!this.element.nativeElement.contains(event.target as Node)) this.dismiss()
  }
  @HostListener('document:keydown.escape', ['$event']) escape(event: KeyboardEvent): void {
    if (!this.open) return
    event.preventDefault(); event.stopPropagation(); this.dismiss()
  }
  @HostListener('window:resize') dismiss(): void { this.open = false; this.pinned = false }
  ngOnDestroy(): void { cancelAnimationFrame(this.frame) }
}
