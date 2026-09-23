import { ChangeDetectorRef, Component, Input, OnChanges, inject } from '@angular/core'
import { clearingAccountFor } from '../core/experience/invoice-portal.data'
@Component({selector:'app-clearing-account-details',standalone:true,
 template:`<section class="clearing-instructions" aria-label="Clearing account details">
  <h3>Clearing account details</h3>
  @if(account;as a){
   @if(a.paybill){<div class="customer-payment-methods" role="tablist" aria-label="Payment method"><button type="button" role="tab" [attr.aria-selected]="method==='bank'" [class.is-active]="method==='bank'" (click)="method='bank'">Bank Transfer</button><button type="button" role="tab" [attr.aria-selected]="method==='mpesa'" [class.is-active]="method==='mpesa'" (click)="method='mpesa'">M-Pesa Paybill</button></div>}
   <div class="customer-payment-details">
    @for(field of fields;track field.label){<div><span><small>{{field.label}}</small><strong>{{field.value}}</strong></span><button type="button" [attr.aria-label]="'Copy '+field.label.toLowerCase()" (click)="copy(field.value,field.label)">Copy</button></div>}
    <div><span><small>Payment reference</small><strong>{{reference}}</strong></span><button type="button" aria-label="Copy payment reference" (click)="copy(reference,'Payment reference')">Copy</button></div>
   </div>
  }@else{<p class="clearing-unavailable">Clearing account details are not available. Contact Avenews to confirm the account before paying.</p>}
  @if(message){<p role="status" aria-live="polite">{{message}}</p>}
 </section>`,
 styles:[`:host{display:block;min-width:0}.clearing-instructions{display:grid;gap:12px;min-width:0}.clearing-instructions h3{margin:0;font-size:16px;color:var(--av-color-text-heading)}.clearing-instructions p{margin:0;font-size:12px;color:var(--av-color-text-muted);line-height:1.6}.customer-payment-methods{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:4px;border-radius:9px;background:var(--av-color-surface-subtle,#f6f7f9)}.customer-payment-methods button{min-height:42px;border:1px solid transparent;border-radius:7px;background:transparent;color:var(--av-color-text,#25384a);font:inherit;font-size:13px;font-weight:700;cursor:pointer}.customer-payment-methods button.is-active{border-color:var(--av-color-primary-border,#bdeff3);background:#fff;color:var(--av-color-action,#16b3c4)}.customer-payment-details{overflow:hidden;border:1px solid var(--av-color-surface-border,#e1e7eb);border-radius:10px;background:#fff}.customer-payment-details>div{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 14px;border-bottom:1px solid var(--av-color-surface-border,#e1e7eb)}.customer-payment-details>div:last-child{border-bottom:0}.customer-payment-details>div>span{min-width:0;display:grid;gap:3px}.customer-payment-details strong{color:var(--av-color-text-heading,#0d343f);font-size:13px;overflow-wrap:anywhere}.customer-payment-details small{color:var(--av-color-text-muted,#66788a);font-size:11px}.customer-payment-details button{flex:0 0 auto;min-height:34px;padding:0 12px;border:1px solid var(--av-color-surface-border,#dfe4e8);border-radius:6px;background:#fff;color:var(--av-color-text-heading,#0d343f);font:inherit;font-size:11px;font-weight:700;cursor:pointer}@media(max-width:767px){.customer-payment-details>div{align-items:flex-start}.customer-payment-details button{min-height:44px}}`],
})
export class ClearingAccountDetailsComponent implements OnChanges {
 @Input() supplierId=''
 @Input() reference=''
 private readonly cdr=inject(ChangeDetectorRef)
 method:'bank'|'mpesa'='bank';message=''
 ngOnChanges():void{this.method='bank';this.message=''}
 get account(){return clearingAccountFor(this.supplierId)}
 get fields():{label:string;value:string}[]{const a=this.account;if(!a)return[];if(this.method==='mpesa'&&a.paybill)return[{label:'Paybill number',value:a.paybill},{label:'Account name',value:a.name},{label:'Account reference',value:a.accountReference??this.reference}];return[{label:'Bank',value:a.bank},{label:'Account name',value:a.name},{label:'Account number',value:a.number},...(a.branchCode?[{label:'Branch code',value:a.branchCode}]:[]),...(a.branch?[{label:'Branch name',value:a.branch}]:[])]}
 async copy(value:string,label:string):Promise<void>{try{await navigator.clipboard.writeText(value);this.message=label+' copied.'}catch{this.message='Select and copy '+label.toLowerCase()+': '+value}finally{this.cdr.markForCheck()}}
}
