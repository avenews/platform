import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import {
  customerWorkspaceById,
  type CustomerFinancingPeriod,
  type CustomerRelationship,
  type CustomerWorkspace,
} from '../../core/experience/customer-product-workspace.data'
import { experienceById, type PortalExperience } from '../../core/experience/contextual-experience.data'
import { ACL_FUNDS_REQUEST_DEMO_URL } from '../../core/experience/experience-links'
import {
  CustomerFilterBarComponent,
  type CustomerFilterField,
  type CustomerSortOption,
} from '../../shared/customer-filter-bar.component'
import { formatDate, formatKes } from '../../shared/customer-portal.data'

@Component({
  selector: 'app-funds-request-hub',
  standalone: true,
  imports: [CustomerFilterBarComponent],
  template: `
    <div class="portal-page request-hub">
      <section class="request-hub__hero"><div><h1>Request funds</h1><p>{{ intro }}</p></div></section>

      @if (workspace?.id === 'acl') {
        <section class="baseline-card request-hub__acl"><div><h2>Start a Funds Request</h2><p>Request financing for an approved purchase and upload the transaction documents in the Funds Request form.</p></div><button type="button" class="baseline-button baseline-button--primary" (click)="openAclRequest()">Request funds</button></section>
      } @else {
        <section class="baseline-section request-list" aria-label="Funds request options">
          <app-customer-filter-bar
            [searchValue]="search"
            [searchPlaceholder]="'Search'"
            [searchAriaLabel]="'Search funds request options'"
            [filters]="filterFields"
            [values]="filterValues"
            [sortOptions]="sortOptions"
            [sortValue]="sort"
            (searchValueChange)="onSearch($event)"
            (valuesChange)="onFilters($event)"
            (sortValueChange)="onSort($event)"
          />

          @if (workspace?.id === 'invoice-financing') {
            <div class="baseline-table-wrap"><table class="baseline-table request-hub__table"><thead><tr><th>Buyer</th><th>Invoice Due Date</th><th>Available Financing</th><th>Status</th><th>Action</th></tr></thead><tbody>
              @for (period of periodPageItems; track period.id) {
                <tr><td><span class="baseline-financing-cell"><strong>{{ period.relationshipName }}</strong><span>{{ period.reference }}</span></span></td><td>{{ formatDate(period.repaymentDueDate, true) }}</td><td><strong>{{ formatKes(period.availableToWithdraw ?? 0) }}</strong></td><td><span class="baseline-status" [class]="'baseline-status ' + period.statusTone">{{ period.statusLabel }}</span></td><td><button type="button" class="baseline-button baseline-button--primary" (click)="requestFromPeriod(period)">Request funds</button></td></tr>
              } @empty { <tr><td colspan="5"><div class="baseline-empty"><strong>No matching financing periods</strong><p>Try changing your search or filters.</p></div></td></tr> }
            </tbody></table></div>
            <div class="baseline-cards request-hub__cards">
              @for (period of periodPageItems; track period.id) { <article class="baseline-record-card"><div class="baseline-record-card__head"><span class="baseline-financing-cell"><strong>{{ period.relationshipName }}</strong><span>{{ period.reference }}</span></span><span class="baseline-status" [class]="'baseline-status ' + period.statusTone">{{ period.statusLabel }}</span></div><div class="baseline-metrics"><span class="baseline-metric"><small>Invoice Due Date</small><strong>{{ formatDate(period.repaymentDueDate, true) }}</strong></span><span class="baseline-metric"><small>Available Financing</small><strong>{{ formatKes(period.availableToWithdraw ?? 0) }}</strong></span></div><button type="button" class="baseline-button baseline-button--primary baseline-button--block" (click)="requestFromPeriod(period)">Request funds</button></article> }
            </div>
            @if (filteredPeriods.length) { <div class="baseline-pagination"><p>Showing <strong>{{ periodRangeStart }}-{{ periodRangeEnd }}</strong> of {{ filteredPeriods.length }} financing periods</p><div class="baseline-pagination__controls"><button type="button" [disabled]="page===1" (click)="changePage(page-1)">‹</button>@for (n of pageNumbers; track n) { <button type="button" [class.is-active]="n===page" (click)="changePage(n)">{{ n }}</button> }<button type="button" [disabled]="page===totalPages" (click)="changePage(page+1)">›</button></div></div> }
          } @else {
            <div class="baseline-table-wrap"><table class="baseline-table request-hub__table"><thead><tr><th>{{ relationshipLabel }}</th><th>Available Financing</th><th>Status</th><th>Action</th></tr></thead><tbody>
              @for (relationship of relationshipPageItems; track relationship.id) { <tr><td><strong>{{ relationship.name }}</strong></td><td><strong>{{ formatKes(relationship.available) }}</strong></td><td><span class="baseline-status" [class]="relationship.available>0?'baseline-status status-success':'baseline-status status-neutral'">{{ relationship.available>0?'Available':'Unavailable' }}</span></td><td><button type="button" class="baseline-button baseline-button--primary" [disabled]="!canRequest(relationship)" (click)="requestFromRelationship(relationship)">Request funds</button></td></tr> }
            </tbody></table></div>
            <div class="baseline-cards request-hub__cards">@for (relationship of relationshipPageItems; track relationship.id) { <article class="baseline-record-card"><div class="baseline-record-card__head"><strong>{{ relationship.name }}</strong><span class="baseline-status" [class]="relationship.available>0?'baseline-status status-success':'baseline-status status-neutral'">{{ relationship.available>0?'Available':'Unavailable' }}</span></div><div class="baseline-metrics"><span class="baseline-metric"><small>Available Financing</small><strong>{{ formatKes(relationship.available) }}</strong></span></div><button type="button" class="baseline-button baseline-button--primary baseline-button--block" [disabled]="!canRequest(relationship)" (click)="requestFromRelationship(relationship)">Request funds</button></article> }</div>
            @if (filteredRelationships.length) { <div class="baseline-pagination"><p>Showing <strong>{{ relationshipRangeStart }}-{{ relationshipRangeEnd }}</strong> of {{ filteredRelationships.length }} {{ relationshipLabel.toLowerCase() }}s</p><div class="baseline-pagination__controls"><button type="button" [disabled]="page===1" (click)="changePage(page-1)">‹</button>@for (n of pageNumbers; track n) { <button type="button" [class.is-active]="n===page" (click)="changePage(n)">{{ n }}</button> }<button type="button" [disabled]="page===totalPages" (click)="changePage(page+1)">›</button></div></div> }
          }
        </section>
      }
    </div>
    @if (toast) { <button type="button" class="baseline-toast" (click)="toast=''">{{ toast }}</button> }
  `,
  styles: [`
    :host{display:block}.request-hub{gap:24px}.request-hub__hero{display:flex;align-items:flex-start;justify-content:space-between;gap:24px}.request-hub__hero>div{display:grid;gap:6px}.request-hub__hero h1,.request-hub__hero p{margin:0}.request-hub__hero h1{color:var(--av-color-text-heading,#0d343f);font-size:32px;line-height:1.15}.request-hub__hero p,.request-hub__acl p{max-width:720px;color:var(--av-color-text-muted,#66788a);font-size:13px;line-height:1.55}.request-hub__acl{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:22px}.request-hub__acl>div{display:grid;gap:6px}.request-hub__acl h2,.request-hub__acl p{margin:0}.request-list{display:grid;gap:16px}.request-list app-customer-filter-bar{width:100%}.request-hub__table{min-width:760px}.request-hub__cards{display:none}@media(max-width:767px){.request-hub{gap:20px}.request-hub__hero h1{font-size:26px}.request-hub__acl{display:grid}.request-hub__acl .baseline-button{width:100%}.request-list{gap:14px}.baseline-table-wrap{display:none}.request-hub__cards{display:grid;gap:12px}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FundsRequestHubComponent {
  private readonly route=inject(ActivatedRoute)
  readonly experience:PortalExperience=this.resolveExperience()
  readonly workspace:CustomerWorkspace|undefined=customerWorkspaceById(this.experience.id)
  readonly formatDate=formatDate
  readonly formatKes=formatKes
  toast=''; search=''; status=''; sort=''; page=1; readonly pageSize=10

  private resolveExperience(){const id=this.route.parent?.snapshot.paramMap.get('experienceId');return experienceById(id)??experienceById('acl')!}
  get intro(){if(this.workspace?.id==='invoice-financing')return'Choose a financing period with funds available and submit a request.';if(this.workspace?.id==='abf')return'Choose a supplier and request financing for an eligible invoice.';if(this.workspace?.id==='stf')return'Choose a Partner Supplier and request financing for an approved purchase.';if(this.workspace?.id==='infx')return'Choose a buyer and request financing for one approved invoice.';return'Request financing for an approved purchase.'}
  get relationshipLabel(){return this.workspace?.id==='abf'||this.workspace?.id==='stf'?'Supplier':'Buyer'}
  get requestRelationships(){return this.workspace?.relationships??[]}
  get filterFields():readonly CustomerFilterField[]{return[{key:'status',label:'Status',allLabel:'All statuses',options:this.workspace?.id==='invoice-financing'?[{value:'live',label:'Live'},{value:'requested',label:'Requested'}]:[{value:'available',label:'Available'},{value:'unavailable',label:'Unavailable'}]}]}
  get filterValues():Readonly<Record<string,string>>{return{status:this.status}}
  get sortOptions():readonly CustomerSortOption[]{
    const common:CustomerSortOption[]=[
      {value:'name-asc',label:`${this.relationshipLabel}: A-Z`},
      {value:'available-desc',label:'Available financing: high to low'},
      {value:'available-asc',label:'Available financing: low to high'},
    ]
    if(this.workspace?.id==='invoice-financing') common.push({value:'due-asc',label:'Invoice due date: earliest'},{value:'due-desc',label:'Invoice due date: latest'})
    return common
  }
  get filteredPeriods():readonly CustomerFinancingPeriod[]{if(this.workspace?.id!=='invoice-financing')return[];const q=this.search.trim().toLowerCase();const items=this.workspace.periods.filter(p=>this.canRequestFromPeriod(p)).filter(p=>!this.status||p.statusKey===this.status).filter(p=>!q||[p.relationshipName,p.reference,p.statusLabel,p.repaymentDueDate,p.availableToWithdraw??0].join(' ').toLowerCase().includes(q));return[...items].sort((a,b)=>{if(this.sort==='name-asc')return a.relationshipName.localeCompare(b.relationshipName);if(this.sort==='available-desc')return(b.availableToWithdraw??0)-(a.availableToWithdraw??0);if(this.sort==='available-asc')return(a.availableToWithdraw??0)-(b.availableToWithdraw??0);if(this.sort==='due-desc')return b.repaymentDueDate.localeCompare(a.repaymentDueDate);return a.repaymentDueDate.localeCompare(b.repaymentDueDate)})}
  get filteredRelationships():readonly CustomerRelationship[]{const q=this.search.trim().toLowerCase();const items=this.requestRelationships.filter(r=>!this.status||(this.status==='available'?r.available>0:r.available<=0)).filter(r=>!q||[r.name,r.available,this.relationshipAvailabilityLabel(r)].join(' ').toLowerCase().includes(q));return[...items].sort((a,b)=>{if(this.sort==='available-desc')return b.available-a.available;if(this.sort==='available-asc')return a.available-b.available;return a.name.localeCompare(b.name)})}
  get currentCount(){return this.workspace?.id==='invoice-financing'?this.filteredPeriods.length:this.filteredRelationships.length}
  get totalPages(){return Math.max(1,Math.ceil(this.currentCount/this.pageSize))}
  get pageNumbers(){return Array.from({length:this.totalPages},(_,i)=>i+1)}
  get periodPageItems(){const s=(this.page-1)*this.pageSize;return this.filteredPeriods.slice(s,s+this.pageSize)}
  get relationshipPageItems(){const s=(this.page-1)*this.pageSize;return this.filteredRelationships.slice(s,s+this.pageSize)}
  get periodRangeStart(){return this.filteredPeriods.length?(this.page-1)*this.pageSize+1:0} get periodRangeEnd(){return Math.min(this.page*this.pageSize,this.filteredPeriods.length)}
  get relationshipRangeStart(){return this.filteredRelationships.length?(this.page-1)*this.pageSize+1:0} get relationshipRangeEnd(){return Math.min(this.page*this.pageSize,this.filteredRelationships.length)}
  onSearch(v:string){this.search=v;this.page=1} onFilters(v:Record<string,string>){this.status=v['status']??'';this.page=1} onSort(v:string){this.sort=v;this.page=1} changePage(p:number){this.page=Math.min(Math.max(1,p),this.totalPages)}
  canRequest(r:CustomerRelationship){return r.available>0&&r.fundsRequestEnabled!==false}
  relationshipAvailabilityLabel(r:CustomerRelationship){return r.available>0?'Available':'Unavailable'}
  requestFromRelationship(r:CustomerRelationship){if(!this.canRequest(r))return;if(r.fundsRequestUrl){const opened=window.open(r.fundsRequestUrl,'_blank','noopener,noreferrer');if(opened)opened.opener=null;else this.toast='Your browser blocked the Funds Request tab. Allow pop-ups and try again.';return}this.toast=`Funds Request started for ${r.name}.`}
  requestFromPeriod(p:CustomerFinancingPeriod){if(!this.canRequestFromPeriod(p))return;this.toast=`You can request up to ${formatKes(p.availableToWithdraw??0)} from this financing period.`}
  openAclRequest(){const opened=window.open(ACL_FUNDS_REQUEST_DEMO_URL,'_blank','noopener,noreferrer');if(opened)opened.opener=null;else this.toast='Your browser blocked the Funds Request tab. Allow pop-ups and try again.'}
  private canRequestFromPeriod(p:CustomerFinancingPeriod){if((p.availableToWithdraw??0)<=0)return false;if(p.statusKey!=='live'&&p.statusKey!=='requested')return false;const d=new Date(`${p.repaymentDueDate}T00:00:00`),t=new Date();t.setHours(0,0,0,0);const days=Math.ceil((d.getTime()-t.getTime())/86_400_000);return days>=7&&days<=60}
}
