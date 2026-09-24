import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core'
import { AvTooltipComponent } from '@avenews/design-system/angular'

/** Keep the installed tooltip's icon, copy and styling, but escape clipping cards.
 * Native popovers render the existing bubble in the browser's top layer. Older
 * browsers use a body-mounted bubble with the same styles and interactions.
 */
@Directive({selector: 'av-tooltip[portalTooltipOverlay]', standalone: true})
export class PortalTooltipOverlayDirective implements AfterViewInit, OnDestroy {
  private static active: PortalTooltipOverlayDirective | null = null
  private static nextId = 0
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly tooltip = inject(AvTooltipComponent)
  private button?: HTMLButtonElement
  private bubble?: HTMLElement
  private nativePopover = false
  private opened = false
  private overTrigger = false
  private overBubble = false
  private frame = 0
  private hideTimer: ReturnType<typeof setTimeout> | undefined
  private observer?: ResizeObserver
  private readonly removeListeners: (() => void)[] = []

  ngAfterViewInit(): void {
    this.button = this.host.nativeElement.querySelector<HTMLButtonElement>('.av-tooltip__btn') ?? undefined
    this.bubble = this.host.nativeElement.querySelector<HTMLElement>('.av-tooltip__bubble') ?? undefined
    if (!this.button || !this.bubble) return
    this.bubble.id = `portal-tooltip-${++PortalTooltipOverlayDirective.nextId}`
    this.bubble.classList.add('portal-tooltip-overlay')
    this.button.setAttribute('aria-describedby', this.bubble.id)
    this.nativePopover = typeof this.bubble.showPopover === 'function'
    if (this.nativePopover) this.bubble.setAttribute('popover', 'manual')
    else {
      this.bubble.setAttribute('data-body-overlay', '')
      this.host.nativeElement.ownerDocument.body.appendChild(this.bubble)
    }

    this.listen(this.button, 'pointerenter', event => {
      if ((event as PointerEvent).pointerType === 'touch') return
      this.overTrigger = true
      this.show()
    })
    this.listen(this.button, 'pointerleave', () => { this.overTrigger = false; this.deferHide() })
    this.listen(this.button, 'focus', () => this.show())
    this.listen(this.button, 'blur', () => this.deferHide())
    // The design-system component's click handler runs first and owns pinning.
    this.listen(this.button, 'click', () => this.tooltip.pinned ? this.show() : this.hide())
    this.listen(this.bubble, 'pointerenter', () => { this.overBubble = true; clearTimeout(this.hideTimer) })
    this.listen(this.bubble, 'pointerleave', () => { this.overBubble = false; this.deferHide() })
    const doc = this.host.nativeElement.ownerDocument
    this.listen(doc, 'pointerdown', event => {
      if (this.opened && !this.button?.contains(event.target as Node) && !this.bubble?.contains(event.target as Node)) this.hide()
    }, true)
    this.listen(doc, 'keydown', event => {
      if (this.opened && (event as KeyboardEvent).key === 'Escape') {
        event.preventDefault()
        event.stopPropagation() // Escape dismisses help before the enclosing modal.
        this.hide()
      }
    }, true)
    this.listen(doc, 'scroll', () => this.schedulePosition(), true)
    this.listen(window, 'resize', () => this.schedulePosition())
    if (window.visualViewport) {
      this.listen(window.visualViewport, 'resize', () => this.schedulePosition())
      this.listen(window.visualViewport, 'scroll', () => this.schedulePosition())
    }
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => this.schedulePosition())
      this.observer.observe(this.button)
      this.observer.observe(this.bubble)
    }
  }

  private listen(target: EventTarget, type: string, listener: (event: Event) => void, capture = false): void {
    target.addEventListener(type, listener, capture)
    this.removeListeners.push(() => target.removeEventListener(type, listener, capture))
  }

  private show(): void {
    clearTimeout(this.hideTimer)
    if (!this.bubble?.isConnected || !this.button?.isConnected) return
    if (PortalTooltipOverlayDirective.active !== this) PortalTooltipOverlayDirective.active?.hide()
    PortalTooltipOverlayDirective.active = this
    if (!this.opened) {
      this.opened = true
      this.bubble.setAttribute('data-open', '')
      if (this.nativePopover) this.bubble.showPopover()
    }
    this.position()
  }

  private deferHide(): void {
    clearTimeout(this.hideTimer)
    this.hideTimer = setTimeout(() => {
      if (!this.tooltip.pinned && !this.overTrigger && !this.overBubble && document.activeElement !== this.button) this.hide()
    }, 120) // Allow the pointer to cross the small gap into the bubble.
  }

  private hide(): void {
    clearTimeout(this.hideTimer)
    cancelAnimationFrame(this.frame)
    if (this.nativePopover && this.opened && this.bubble?.isConnected && this.bubble.matches(':popover-open')) this.bubble.hidePopover()
    this.bubble?.removeAttribute('data-open')
    this.opened = false
    this.overBubble = false
    this.tooltip.onDocumentClick()
    if (PortalTooltipOverlayDirective.active === this) PortalTooltipOverlayDirective.active = null
  }

  private schedulePosition(): void {
    if (!this.opened) return
    cancelAnimationFrame(this.frame)
    this.frame = requestAnimationFrame(() => this.position())
  }

  private position(): void {
    if (!this.opened || !this.button || !this.bubble) return
    const rect = this.button.getBoundingClientRect()
    const viewport = window.visualViewport
    const edge = 12
    const left = (viewport?.offsetLeft ?? 0) + edge
    const top = (viewport?.offsetTop ?? 0) + edge
    const right = left + (viewport?.width ?? document.documentElement.clientWidth) - edge * 2
    const bottom = top + (viewport?.height ?? innerHeight) - edge * 2
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2
    if (!rect.width || !rect.height || cx < left - edge || cx > right + edge || cy < top - edge || cy > bottom + edge) { this.hide(); return }
    // A scrolled-away trigger must not leave a floating, detached explanation.
    for (let parent = this.button.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      const style = getComputedStyle(parent), box = parent.getBoundingClientRect()
      if ((/(auto|scroll|hidden|clip)/.test(style.overflowX) && (cx < box.left || cx > box.right)) ||
          (/(auto|scroll|hidden|clip)/.test(style.overflowY) && (cy < box.top || cy > box.bottom))) { this.hide(); return }
    }
    this.bubble.style.setProperty('max-width', `${Math.max(0, Math.min(300, right - left))}px`, 'important')
    this.bubble.style.setProperty('max-height', `${Math.max(0, bottom - top)}px`, 'important')
    const bubble = this.bubble.getBoundingClientRect()
    const x = Math.max(left, Math.min(cx - bubble.width / 2, right - bubble.width))
    const below = bottom - rect.bottom - 6, above = rect.top - top - 6
    const y = below < bubble.height && above > below ? rect.top - bubble.height - 6 : rect.bottom + 6
    this.bubble.style.setProperty('left', `${x}px`, 'important')
    this.bubble.style.setProperty('top', `${Math.max(top, Math.min(y, bottom - bubble.height))}px`, 'important')
  }

  ngOnDestroy(): void {
    this.hide()
    this.observer?.disconnect()
    this.removeListeners.forEach(remove => remove())
    if (!this.nativePopover) this.bubble?.remove()
  }
}
