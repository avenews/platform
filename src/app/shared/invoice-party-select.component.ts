import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { canUploadFor, type InvoiceParty, type InvoicePortalRole } from '../core/experience/invoice-portal.data'
import { PortalActionIconComponent } from './portal-action-icon.component'

let nextId = 0
@Component({
  selector: 'app-invoice-party-select', standalone: true, imports: [FormsModule, PortalActionIconComponent],
  template: `<div class="baseline-field party-select">
    <label [for]="id">{{ label }}</label>
    <div class="party-select__control">
      <input [id]="id" class="baseline-control" type="text" role="combobox" autocomplete="off"
        [attr.aria-expanded]="open" aria-autocomplete="list" [attr.aria-controls]="open ? id+'-list' : null"
        [attr.aria-describedby]="id+'-hint'" [attr.aria-activedescendant]="open && matches[highlight] ? id+'-option-'+highlight : null"
        [placeholder]="'Search '+label.toLowerCase()+'s'" [ngModel]="query" (ngModelChange)="search($event)"
        (focus)="show()" (keydown)="key($event)" />
      <button type="button" class="party-select__toggle" [attr.aria-label]="'Choose '+label.toLowerCase()"
        [attr.aria-expanded]="open" (mousedown)="$event.preventDefault()" (click)="toggle()">
        <app-portal-action-icon name="chevron-down" />
      </button>
    </div>
    <small class="party-select__hint" [id]="id+'-hint'">You upload invoices</small>
    @if (open) {
      <div [id]="id+'-list'" class="party-select__list" role="listbox" [attr.aria-label]="label+'s'"
        [style.left.px]="popup.left" [style.top.px]="popup.top" [style.width.px]="popup.width" [style.max-height.px]="popup.height">
        @for (party of matches; track party.id; let i = $index) {
          <button type="button" role="option" tabindex="-1" [id]="id+'-option-'+i" [attr.aria-selected]="party.id===value"
            [attr.aria-disabled]="!allowed(party)" [disabled]="!allowed(party)" [class.is-highlighted]="highlight===i"
            (mousedown)="$event.preventDefault()" (click)="choose(party)">
            <span>{{party.name}}</span><small>{{responsibility(party)}}</small>
          </button>
        }
        @if (!matches.length) { <p>No matching {{label.toLowerCase()}}s</p> }
        @if (matchCount>30) { <p>{{matchCount}} matches. Type more to narrow the list.</p> }
      </div>
    }
  </div>`,
  styleUrl: './invoice-party-select.component.css',
})
export class InvoicePartySelectComponent implements OnChanges, OnDestroy, OnInit {
  @Input() parties: readonly InvoiceParty[] = []
  @Input() role: InvoicePortalRole = 'supplier'
  @Input() label = 'Buyer'
  @Input() value = ''
  @Output() valueChange = new EventEmitter<string>()
  readonly id = 'invoice-party-' + (++nextId)
  private readonly el: ElementRef<HTMLElement> = inject(ElementRef)
  query = ''
  open = false
  highlight = -1
  popup = {left: 0, top: 0, width: 0, height: 240}
  private frame = 0
  private readonly onViewportChange = () => this.reposition()
  private readonly onScroll = (event: Event) => {
    // Scrolling the options must not move the list or affect the page beneath it.
    if (!(event.target as HTMLElement)?.closest?.('.party-select__list')) this.reposition()
  }

  ngOnInit(): void {
    document.addEventListener('scroll', this.onScroll, true)
    window.visualViewport?.addEventListener('resize', this.onViewportChange)
    window.visualViewport?.addEventListener('scroll', this.onViewportChange)
  }
  ngOnChanges(): void { if (!this.open) this.query = this.selected?.name ?? '' }
  get selected() { return this.parties.find(p => p.id === this.value) }
  get filtered() { const q = this.query.trim().toLowerCase(); return this.parties.filter(p => !q || p.name.toLowerCase().includes(q)) }
  get matches() { return this.filtered.slice(0, 30) }
  get matchCount() { return this.filtered.length }
  allowed(p: InvoiceParty): boolean { return canUploadFor(p, this.role) }
  responsibility(p: InvoiceParty): string { return this.allowed(p) ? 'You upload invoices' : this.role === 'supplier' ? 'Buyer uploads invoices' : 'Supplier uploads invoices' }

  show(): void {
    if (this.open) return
    this.query = ''
    this.open = true
    this.highlight = this.matches.findIndex(p => p.id === this.value && this.allowed(p))
    this.reposition()
  }
  toggle(): void { if (this.open) this.dismiss(); else { this.show(); this.input()?.focus({preventScroll: true}) } }
  search(query: string): void {
    this.query = query
    this.open = true
    this.highlight = this.matches.findIndex(p => this.allowed(p))
    // Searching is not selecting. Keep the committed value, files and declaration intact.
    this.reposition()
  }
  choose(p: InvoiceParty): void {
    if (!this.allowed(p)) return
    const changed = p.id !== this.value
    this.value = p.id
    this.query = p.name
    this.open = false
    if (changed) this.valueChange.emit(p.id)
  }
  dismiss(): void { this.open = false; this.query = this.selected?.name ?? '' }
  key(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open) { event.preventDefault(); event.stopPropagation(); this.dismiss(); return }
    if (event.key === 'Tab') { this.dismiss(); return }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      this.show()
      const step = event.key === 'ArrowDown' ? 1 : -1
      const items = this.matches
      let next = this.highlight
      for (let i = 0; i < items.length; i++) {
        next = (next + step + items.length) % items.length
        if (this.allowed(items[next])) { this.highlight = next; break }
      }
      cancelAnimationFrame(this.frame)
      this.frame = requestAnimationFrame(() => this.el.nativeElement.querySelector('#'+this.id+'-option-'+this.highlight)?.scrollIntoView({block:'nearest'}))
    }
    if (event.key === 'Enter' && this.open) { event.preventDefault(); const p = this.matches[this.highlight]; if (p) this.choose(p) }
  }
  @HostListener('window:resize') reposition(): void {
    if (!this.open) return
    const control = this.el.nativeElement.querySelector('.party-select__control')?.getBoundingClientRect()
    if (!control) return
    const viewport = window.visualViewport
    const top = (viewport?.offsetTop ?? 0) + 8
    const bottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? innerHeight) - 8
    const below = bottom - control.bottom - 4
    const above = control.top - top - 4
    const flip = below < 150 && above > below
    const height = Math.max(0, Math.min(240, flip ? above : below))
    this.popup = {left: control.left, width: control.width, height, top: flip ? control.top - height - 4 : control.bottom + 4}
  }
  private input(): HTMLInputElement | null { return this.el.nativeElement.querySelector('input') }
  @HostListener('document:click', ['$event']) outside(event: Event): void { if (!this.el.nativeElement.contains(event.target as Node)) this.dismiss() }
  ngOnDestroy(): void {
    if (typeof document === 'undefined') return
    cancelAnimationFrame(this.frame)
    document.removeEventListener('scroll', this.onScroll, true)
    window.visualViewport?.removeEventListener('resize', this.onViewportChange)
    window.visualViewport?.removeEventListener('scroll', this.onViewportChange)
  }
}
