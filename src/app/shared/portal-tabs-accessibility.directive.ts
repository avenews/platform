import { AfterViewChecked, Directive, ElementRef, HostListener, Input, inject } from '@angular/core'

/** Add keyboard navigation and panel labels to the existing design-system tabs.
 * The vendor component remains responsible for rendering, styling and selection.
 */
@Directive({selector: 'av-tabs[portalTablistLabel]', standalone: true})
export class PortalTabsAccessibilityDirective implements AfterViewChecked {
  @Input() portalTablistLabel = ''
  private readonly element: ElementRef<HTMLElement> = inject(ElementRef)

  ngAfterViewChecked(): void {
    const host = this.element.nativeElement
    host.querySelector('[role="tablist"]')?.setAttribute('aria-label', this.portalTablistLabel)
    for (const tab of this.tabs()) {
      const panelId = tab.getAttribute('aria-controls')
      if (panelId) tab.id = panelId.replace('av-tab-panel-', 'av-tab-')
      tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1
    }
  }

  @HostListener('keydown', ['$event']) onKeydown(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    const tabs = this.tabs().filter(tab => !tab.disabled)
    const current = tabs.indexOf((event.target as HTMLElement).closest<HTMLButtonElement>('[role="tab"]')!)
    if (current < 0 || !tabs.length) return
    event.preventDefault()
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
      : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
    tabs[index].click()
    tabs[index].focus({preventScroll: true})
  }

  private tabs(): HTMLButtonElement[] {
    return Array.from(this.element.nativeElement.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
  }
}
