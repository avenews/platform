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
  customerWorkspaceById,
  periodsForRelationship,
  type CustomerFinancingPeriod,
  type CustomerProductId,
  type CustomerRelationship,
  type CustomerWorkspace,
} from '../../core/experience/customer-product-workspace.data'
import {
  experienceById,
  type PortalExperience,
} from '../../core/experience/contextual-experience.data'
import { CustomerFinancingPeriodModalComponent } from '../../shared/customer-financing-period-modal.component'
import {
  CustomerFilterBarComponent,
  type CustomerFilterField,
  type CustomerSortOption,
} from '../../shared/customer-filter-bar.component'
import { formatDate, formatKes } from '../../shared/customer-portal.data'
import { PrototypeExplainerComponent } from '../../shared/prototype-explainer.component'

interface RelationshipPageCopy { heading: string; intro: string }
const RELATIONSHIP_PAGE_COPY: Record<CustomerProductId, RelationshipPageCopy> = {
  acl:{heading:'Financing',intro:'View your financing periods and repayment details.'},
  abf:{heading:'Suppliers',intro:'Choose a supplier to view available financing or request funds.'},
  stf:{heading:'Partner Suppliers',intro:'Choose a Partner Supplier to view available financing or request funds.'},
  'invoice-financing':{heading:'Buyers',intro:'Choose a buyer to view financing periods, upload invoices or request funds.'},
  infx:{heading:'Buyers',intro:'Choose a buyer to view available financing or request funds for an invoice.'},
}

@Component({
  selector:'app-contextual-financing', standalone:true,
  imports:[PrototypeExplainerComponent,CustomerFinancingPeriodModalComponent,CustomerFilterBarComponent],
  templateUrl:'./contextual-financing.component.html', styleUrl:'./contextual-financing.component.css',
  changeDetection:ChangeDetectionStrategy.OnPush,
})
export class ContextualFinancingComponent implements OnDestroy {
  private readonly route=inject(ActivatedRoute); private readonly router=inject(Router); private readonly cdr=inject(ChangeDetectorRef); private readonly destroyed$=new Subject<void>()
  experience:PortalExperience=this.resolveExperience(); workspace:CustomerWorkspace|undefined=customerWorkspaceById(this.experience.id)
  selectedRelationship:CustomerRelationship|null=null; selectedPeriod:CustomerFinancingPeriod|null=null; invoiceUploadRelationship:CustomerRelationship|null=null; returnRelationship:CustomerRelationship|null=null
  toast=''; search=''; status=''; sort=''; page=1; readonly pageSize=10
  readonly formatDate=formatDate; readonly formatKes=formatKes
  readonly filterFields:readonly CustomerFilterField[]=[{key:'status',label:'Status',allLabel:'All statuses',options:[{value:'available',label:'Available'},{value:'unavailable',label:'Unavailable'}]}]

  constructor(){this.route.parent?.paramMap.pipe(takeUntil(this.destroyed$)).subscribe(params=>{this.experience=experienceById(params.get('experienceId'))??experienceById('acl')!;this.workspace=customerWorkspaceById(this.experience.id);this.closeOverlays();this.resetList();if(this.experience.id==='acl'){void this.router.navigate(['/experience','acl','home'],{replaceUrl:true});return}this.cdr.markForCheck()})}
  private resolveExperience(){const id=this.route.parent?.snapshot.paramMap.get('experienceId');return experienceById(id)??experienceById('acl')!}
  get relationshipHeading(){return this.workspace?RELATIONSHIP_PAGE_COPY[this.workspace.id].heading:'Financing'}
  get relationshipIntro(){return this.workspace?RELATIONSHIP_PAGE_COPY[this.workspace.id].intro:''}
  get filterValues():Readonly<Record<string,string>>{return{status:this.status}}
  get sortOptions():readonly CustomerSortOption[]{const noun=this.workspace?.relationshipNoun??'Name';return[{value:'name-asc',label:`${noun}: A-Z`},{value:'available-desc',label:'Financing available: high to low'},{value:'available-asc',label:'Financing available: low to high'},{value:'status-asc',label:'Status: A-Z'}]}
  get filteredRelationships():readonly CustomerRelationship[]{const q=this.search.trim().toLowerCase();const items=(this.workspace?.relationships??[]).filter(r=>!this.status||(this.status==='available'?this.relationshipAvailable(r)>0:this.relationshipAvailable(r)<=0)).filter(r=>!q||[r.name,formatKes(this.relationshipAvailable(r)),this.relationshipAvailabilityLabel(r)].join(' ').toLowerCase().includes(q));return[...items].sort((a,b)=>{if(this.sort==='available-desc')return this.relationshipAvailable(b)-this.relationshipAvailable(a);if(this.sort==='available-asc')return this.relationshipAvailable(a)-this.relationshipAvailable(b);if(this.sort==='status-asc')return this.relationshipAvailabilityLabel(a).localeCompare(this.relationshipAvailabilityLabel(b));return a.name.localeCompare(b.name)})}
  get relationshipPageItems(){const s=(this.page-1)*this.pageSize;return this.filteredRelationships.slice(s,s+this.pageSize)}
  get totalPages(){return Math.max(1,Math.ceil(this.filteredRelationships.length/this.pageSize))}
  get pageNumbers(){return Array.from({length:this.totalPages},(_,i)=>i+1)}
  get rangeStart(){return this.filteredRelationships.length?(this.page-1)*this.pageSize+1:0} get rangeEnd(){return Math.min(this.page*this.pageSize,this.filteredRelationships.length)}
  onSearch(v:string){this.search=v;this.page=1} onFilters(v:Record<string,string>){this.status=v['status']??'';this.page=1} onSort(v:string){this.sort=v;this.page=1} changePage(p:number){this.page=Math.min(Math.max(1,p),this.totalPages)} private resetList(){this.search='';this.status='';this.sort='';this.page=1}
  get periodBackLabel(){return this.returnRelationship?`Back to ${this.relationshipCustomerType(this.returnRelationship)}`:null}
  relationshipAvailable(r:CustomerRelationship){if(this.workspace?.id==='abf'&&r.id==='abf-quickmart')return 0;if(this.workspace?.id==='stf'&&r.id==='stf-greenharvest')return 0;if(this.workspace?.id==='invoice-financing'&&r.id==='inf-fresh')return 0;return r.available}
  relationshipUsed(r:CustomerRelationship){return Math.max(0,r.limit-this.relationshipAvailable(r))}
  relationshipAvailabilityLabel(r:CustomerRelationship){return this.relationshipAvailable(r)>0?'Available':'Unavailable'}
  relationshipAvailabilityTone(r:CustomerRelationship){return this.relationshipAvailable(r)>0?'status-success':'status-neutral'}
  relationshipAvailabilityTooltip(r:CustomerRelationship){return this.relationshipAvailable(r)>0?'Financing is available.':'No financing is currently available.'}
  relationshipCustomerType(r:CustomerRelationship){if(r.relationshipType.includes('Supplier'))return'Supplier';if(r.relationshipType.includes('Buyer'))return'Buyer';return r.relationshipType}
  invoiceUploadSourceLabel(r:CustomerRelationship){return r.invoiceUploadOwner==='client'?'You upload invoices':'Buyer uploads invoices'}
  canUploadInvoices(r:CustomerRelationship){return this.workspace?.id==='invoice-financing'&&r.invoiceUploadOwner==='client'}
  openRelationship(r:CustomerRelationship){this.selectedRelationship=r;this.selectedPeriod=null;this.invoiceUploadRelationship=null;this.returnRelationship=null}
  closeRelationship(){this.selectedRelationship=null}
  relationshipPeriods(r:CustomerRelationship):readonly CustomerFinancingPeriod[]{if(!this.workspace)return[];return periodsForRelationship(this.workspace,r).map((period,index)=>({period,index})).sort((a,b)=>{const ao=a.period.statusKey==='overdue'||a.period.paymentAttention==='overdue',bo=b.period.statusKey==='overdue'||b.period.paymentAttention==='overdue';if(ao!==bo)return ao?-1:1;return a.index-b.index}).map(x=>x.period)}
  openPeriod(p:CustomerFinancingPeriod){this.returnRelationship=this.selectedRelationship;this.selectedRelationship=null;this.selectedPeriod=p}
  backToRelationship(){this.selectedPeriod=null;this.restoreRelationship()}
  closePeriod(){this.selectedPeriod=null;this.returnRelationship=null}
  canRequestFromPeriod(p:CustomerFinancingPeriod){if(this.workspace?.id!=='invoice-financing'||(p.availableToWithdraw??0)<=0||(p.statusKey!=='live'&&p.statusKey!=='requested'))return false;return this.isWithinInvoiceFundingWindow(p)}
  startFundsRequest(r:CustomerRelationship,e?:Event){e?.stopPropagation();if(!r.fundsRequestEnabled||this.relationshipAvailable(r)<=0)return;if(r.fundsRequestUrl){const opened=window.open(r.fundsRequestUrl,'_blank','noopener,noreferrer');if(opened){opened.opener=null;return}this.toast='Your browser blocked the Funds Request tab. Allow pop-ups and try again.';this.cdr.markForCheck();return}this.toast=`Funds Request started for ${r.name}.`;this.cdr.markForCheck()}
  requestFundsForPeriod(p:CustomerFinancingPeriod,e?:Event){e?.stopPropagation();if(!this.canRequestFromPeriod(p))return;this.toast=`You can request up to ${formatKes(p.availableToWithdraw??0)} from this financing period.`;this.cdr.markForCheck()}
  startInvoiceUpload(r:CustomerRelationship,e?:Event){e?.stopPropagation();if(!this.canUploadInvoices(r))return;this.returnRelationship=this.selectedRelationship;this.selectedRelationship=null;this.invoiceUploadRelationship=r}
  closeInvoiceUpload(){this.invoiceUploadRelationship=null;this.restoreRelationship()}
  completeInvoiceUpload(){const r=this.invoiceUploadRelationship;if(!r)return;this.invoiceUploadRelationship=null;this.toast=`Invoice received for ${r.name}. Eligible invoices will appear in the matching financing period.`;this.restoreRelationship();this.cdr.markForCheck()}
  closeOverlays(){this.selectedRelationship=null;this.selectedPeriod=null;this.invoiceUploadRelationship=null;this.returnRelationship=null}
  private isWithinInvoiceFundingWindow(p:CustomerFinancingPeriod){const d=new Date(`${p.repaymentDueDate}T00:00:00`),t=new Date();t.setHours(0,0,0,0);const days=Math.ceil((d.getTime()-t.getTime())/86_400_000);return days>=7&&days<=60}
  private restoreRelationship(){if(!this.returnRelationship)return;this.selectedRelationship=this.returnRelationship;this.returnRelationship=null}
  ngOnDestroy(){this.destroyed$.next();this.destroyed$.complete()}
}
