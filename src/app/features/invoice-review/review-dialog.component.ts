import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core'

let nextDialogId = 0
let modalCount = 0
let savedOverflow = ''
@Component({
  selector: 'app-review-dialog', standalone: true,
  template: `<dialog #dialog class="review-dialog" [attr.aria-labelledby]="id" (cancel)="cancel($event)" (click)="backdrop($event)">
    <header class="review-dialog-head">
      <div class="review-dialog-heading">
        @if (backLabel) { <button type="button" class="baseline-button baseline-button--secondary review-back" (click)="back.emit()">&#8592; {{ backLabel }}</button> }
        <h2 [id]="id">{{ title }}</h2>
        @if (subtitle) { <p>{{ subtitle }}</p> }
      </div>
      <button type="button" class="review-dialog-close" aria-label="Close dialog" (click)="close.emit()">&#215;</button>
    </header>
    <div class="review-dialog-body"><ng-content /></div>
  </dialog>`,
  styles: [`
    .review-dialog{box-sizing:border-box;width:min(960px,calc(100vw - 48px));max-width:960px;max-height:90dvh;padding:0;margin:auto;border:1px solid var(--av-color-surface-border,#e1e7eb);border-radius:14px;background:white;color:var(--av-color-text-heading,#0d343f);overflow:hidden;box-shadow:0 18px 70px #1234}
    .review-dialog[open]{display:flex;flex-direction:column}
    .review-dialog::backdrop{background:rgba(15,31,45,.48)}
    .review-dialog-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:20px 24px;border-bottom:1px solid var(--av-color-surface-border,#e1e7eb);flex:0 0 auto}
    .review-dialog-heading{min-width:0;display:grid;gap:5px}
    .review-dialog-heading h2{font-size:22px;line-height:1.3;margin:0;overflow-wrap:anywhere}
    .review-dialog-heading p{margin:0;color:var(--av-color-text-muted,#66788a);font-size:13px;line-height:1.5;overflow-wrap:anywhere}
    .review-dialog-close{width:44px;height:44px;flex:0 0 44px;border:0;border-radius:8px;background:transparent;color:#66788a;font-size:28px;cursor:pointer}
    .review-dialog-close:hover{background:#f1f5f7}
    .review-dialog-close:focus-visible{outline:2px solid #12b4c6;outline-offset:2px}
    .review-dialog-body{min-height:0;overflow:auto;overscroll-behavior:contain;padding:24px;flex:1 1 auto}
    .review-back{justify-self:start;margin-bottom:7px;min-height:40px}
    @media(max-width:767px){.review-dialog{width:100%;max-height:94dvh;border-radius:18px 18px 0 0;margin:auto auto 0;max-width:100%}.review-dialog-head{padding:16px}.review-dialog-heading h2{font-size:19px}.review-dialog-body{padding:16px}}
  `],
})
export class ReviewDialogComponent implements AfterViewInit, OnDestroy {
  @Input() title = ''
  @Input() subtitle = ''
  @Input() backLabel = ''
  @Output() close = new EventEmitter<void>()
  @Output() back = new EventEmitter<void>()
  @ViewChild('dialog', { static: true }) dialog!: ElementRef<HTMLDialogElement>
  readonly id = `review-dialog-${++nextDialogId}`
  private opener: HTMLElement | null = null
  ngAfterViewInit(): void {
    this.opener = document.activeElement as HTMLElement
    if (modalCount++ === 0) { savedOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden' }
    this.dialog.nativeElement.showModal()
  }
  cancel(event: Event): void { event.preventDefault(); this.close.emit() }
  backdrop(event: MouseEvent): void {
    if (event.target !== this.dialog.nativeElement) return
    const r = this.dialog.nativeElement.getBoundingClientRect()
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) this.close.emit()
  }
  ngOnDestroy(): void {
    this.dialog.nativeElement.close()
    if (--modalCount === 0) document.body.style.overflow = savedOverflow
    if (this.opener?.isConnected) this.opener.focus()
  }
}
