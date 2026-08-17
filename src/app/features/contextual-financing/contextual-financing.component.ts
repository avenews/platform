import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  inject,
} from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Subject, takeUntil } from 'rxjs'
import {
  experienceById,
  type PortalExperience,
} from '../../core/experience/contextual-experience.data'
import { PrototypeExplainerComponent } from '../../shared/prototype-explainer.component'

type PrototypeFlow = 'acl' | 'abf' | 'stf' | 'infx' | 'invoice-upload' | ''
type AbfInvoiceType = 'fully-paid' | 'unpaid' | ''

@Component({
  selector: 'app-contextual-financing',
  standalone: true,
  imports: [PrototypeExplainerComponent],
  templateUrl: './contextual-financing.component.html',
  styleUrl: './contextual-financing.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextualFinancingComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly cdr = inject(ChangeDetectorRef)
  private readonly destroyed$ = new Subject<void>()

  experience: PortalExperience = this.resolveExperience()
  selectedFlow: PrototypeFlow = ''
  abfInvoiceType: AbfInvoiceType = ''
  uploadRelationship = ''
  toast = ''

  constructor() {
    this.route.parent?.paramMap
      .pipe(takeUntil(this.destroyed$))
      .subscribe(params => {
        this.experience = experienceById(params.get('experienceId')) ?? experienceById('acl')!
        this.closeFlow()
        this.cdr.markForCheck()
      })
  }

  private resolveExperience(): PortalExperience {
    const id = this.route.parent?.snapshot.paramMap.get('experienceId')
    return experienceById(id) ?? experienceById('acl')!
  }

  openFundsRequest(flow: Exclude<PrototypeFlow, 'invoice-upload' | ''>): void {
    this.selectedFlow = flow
    this.abfInvoiceType = ''
  }

  openInvoiceUpload(relationship: string): void {
    this.uploadRelationship = relationship
    this.selectedFlow = 'invoice-upload'
  }

  selectAbfInvoiceType(type: Exclude<AbfInvoiceType, ''>): void {
    this.abfInvoiceType = type
  }

  closeFlow(): void {
    this.selectedFlow = ''
    this.abfInvoiceType = ''
    this.uploadRelationship = ''
  }

  completePrototype(message: string): void {
    this.toast = message
    this.closeFlow()
  }

  openPeriod(periodId: string): void {
    void this.router.navigate(['/experience', 'invoice-financing', 'financing', 'period', periodId])
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
  }
}
