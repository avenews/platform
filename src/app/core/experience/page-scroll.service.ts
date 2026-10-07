import { Injectable, OnDestroy, inject } from '@angular/core'
import { NavigationEnd, Router } from '@angular/router'
import { filter } from 'rxjs'

@Injectable({providedIn: 'root'})
export class PageScrollService implements OnDestroy {
  private readonly router = inject(Router)
  private previousPath = ''
  private frame = 0
  private readonly previousRestoration = history.scrollRestoration
  private readonly navigation = this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe(event => {
    const path = event.urlAfterRedirects.split(/[?#]/)[0]
    if (path === this.previousPath) return
    this.previousPath = path
    cancelAnimationFrame(this.frame)
    this.frame = requestAnimationFrame(() => window.scrollTo({top: 0, left: 0, behavior: 'instant'}))
  })
  constructor() { history.scrollRestoration = 'manual' }
  ngOnDestroy(): void {
    this.navigation.unsubscribe()
    cancelAnimationFrame(this.frame)
    history.scrollRestoration = this.previousRestoration
  }
}
