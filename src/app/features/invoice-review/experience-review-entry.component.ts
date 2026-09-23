import { Component, OnDestroy, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { combineLatest, Subject, takeUntil } from 'rxjs'
import { ContextualHomeComponent } from '../contextual-home/contextual-home.component'
import { ContextualFinancingComponent } from '../contextual-financing/contextual-financing.component'
import { FundsRequestHubComponent } from '../funds-request-hub/funds-request-hub.component'
import { CustomerInvoicesComponent } from '../customer-invoices/customer-invoices.component'
import { InvoicePeriodComponent } from '../invoice-period/invoice-period.component'
import { PartnerWorkspaceComponent } from '../partner-workspace/partner-workspace.component'
import { InvoiceReviewPageComponent, ReviewSection } from './invoice-review-page.component'
import { InvoiceRole } from './invoice-review.store'

/** Only Invoice Financing and the Partner Buyer portal opt into this review. */
@Component({
  selector:'app-experience-review-entry', standalone:true,
  imports:[InvoiceReviewPageComponent, ContextualHomeComponent, ContextualFinancingComponent,
    FundsRequestHubComponent, CustomerInvoicesComponent, InvoicePeriodComponent, PartnerWorkspaceComponent],
  template:`
    @if (role; as reviewRole) {
      <app-invoice-review-page [role]="reviewRole" [section]="section" [initialPeriodId]="periodId" [requestedAction]="action" />
    } @else {
      @switch (section) {
        @case ('home') { <app-contextual-home /> }
        @case ('financing') { <app-contextual-financing /> }
        @case ('request-funds') { <app-funds-request-hub /> }
        @case ('invoices') { <app-customer-invoices /> }
        @case ('period') { <app-invoice-period /> }
        @default { <app-partner-workspace /> }
      }
    }
  `,
  styles:[`:host{display:block;min-width:0}`],
})
export class ExperienceReviewEntryComponent implements OnDestroy {
  private readonly route=inject(ActivatedRoute)
  private readonly destroyed$=new Subject<void>()
  role:InvoiceRole|null=null
  section:ReviewSection='home'
  periodId=''
  action=''
  constructor() {
    const parent=this.route.parent
    if (!parent) return
    combineLatest([parent.paramMap,this.route.data,this.route.paramMap,this.route.queryParamMap])
      .pipe(takeUntil(this.destroyed$)).subscribe(([params,data,local,query])=>{
        const id=params.get('experienceId')
        this.role=id==='invoice-financing'?'supplier':id==='invoice-partner'?'partner':null
        this.section=(data['reviewSection']??'home') as ReviewSection
        this.periodId=local.get('periodId')??''
        this.action=query.get('action')??''
      })
  }
  ngOnDestroy():void{this.destroyed$.next();this.destroyed$.complete()}
}
