import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  type OnChanges,
  type SimpleChanges,
} from '@angular/core'
import { FormsModule } from '@angular/forms'

export interface CustomerFilterOption {
  value: string
  label: string
}

export interface CustomerFilterField {
  key: string
  label: string
  allLabel: string
  options: readonly CustomerFilterOption[]
}

@Component({
  selector: 'app-customer-filter-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './customer-filter-bar.component.html',
  styleUrl: './customer-filter-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFilterBarComponent implements OnChanges {
  private static nextPanelId = 0

  readonly panelId = `customer-filter-panel-${CustomerFilterBarComponent.nextPanelId++}`

  @Input() searchValue = ''
  @Input() searchPlaceholder = 'Search'
  @Input() searchAriaLabel = 'Search records'
  @Input() filters: readonly CustomerFilterField[] = []
  @Input() values: Readonly<Record<string, string>> = {}

  @Output() readonly searchValueChange = new EventEmitter<string>()
  @Output() readonly valuesChange = new EventEmitter<Record<string, string>>()

  mobileOpen = false
  draftValues: Record<string, string> = {}

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['filters'] || changes['values']) && !this.mobileOpen) {
      this.syncDraftValues()
    }
  }

  get hasActiveFilters(): boolean {
    return Boolean(
      this.searchValue.trim()
      || this.filters.some(filter => Boolean(this.values[filter.key])),
    )
  }

  valueFor(key: string): string {
    return this.values[key] ?? ''
  }

  draftValueFor(key: string): string {
    return this.draftValues[key] ?? ''
  }

  onSearchChange(value: string): void {
    this.searchValueChange.emit(value)
  }

  onDesktopFilterChange(key: string, value: string): void {
    this.valuesChange.emit({ ...this.values, [key]: value })
  }

  toggleMobileFilters(): void {
    if (this.mobileOpen) {
      this.mobileOpen = false
      return
    }

    this.syncDraftValues()
    this.mobileOpen = true
  }

  updateDraftValue(key: string, value: string): void {
    this.draftValues = { ...this.draftValues, [key]: value }
  }

  clearAllFilters(): void {
    const nextValues: Record<string, string> = {}
    for (const filter of this.filters) nextValues[filter.key] = ''
    this.draftValues = nextValues
    this.searchValueChange.emit('')
    this.valuesChange.emit(nextValues)
    this.mobileOpen = false
  }

  applyDraftValues(): void {
    const nextValues: Record<string, string> = { ...this.values }
    for (const filter of this.filters) {
      nextValues[filter.key] = this.draftValues[filter.key] ?? ''
    }
    this.valuesChange.emit(nextValues)
    this.mobileOpen = false
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.mobileOpen = false
  }

  private syncDraftValues(): void {
    const nextValues: Record<string, string> = {}
    for (const filter of this.filters) nextValues[filter.key] = this.values[filter.key] ?? ''
    this.draftValues = nextValues
  }
}
