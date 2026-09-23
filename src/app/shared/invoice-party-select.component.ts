import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { canUploadFor, type InvoiceParty, type InvoicePortalRole } from '../core/experience/invoice-portal.data'
let nextId=0
@Component({
  selector:'app-invoice-party-select',standalone:true,imports:[FormsModule],
  template:`<div class="baseline-field party-select">
    <label [for]="id">{{ label }}</label>
    <div class="party-select__control"><input [id]="id" class="baseline-control" type="text" role="combobox" autocomplete="off"
      [attr.aria-expanded]="open" aria-autocomplete="list" [attr.aria-controls]="id+'-list'" [attr.aria-activedescendant]="open && matches[highlight] ? id+'-option-'+highlight : null"
      [placeholder]="'Search '+label.toLowerCase()+'s'" [ngModel]="query" (ngModelChange)="search($event)" (focus)="show()" (keydown)="key($event)" />
      <button type="button" class="party-select__toggle" [attr.aria-label]="'Choose '+label.toLowerCase()" [attr.aria-expanded]="open" (click)="toggle()">&#8964;</button>
    </div>
    @if(open){<div [id]="id+'-list'" class="party-select__list" role="listbox" [attr.aria-label]="label+'s'">
      @for(party of matches;track party.id;let i=$index){<button type="button" role="option" [id]="id+'-option-'+i" [attr.aria-selected]="party.id===value" [attr.aria-disabled]="!allowed(party)" [class.is-highlighted]="highlight===i" (mousedown)="$event.preventDefault()" (click)="choose(party)"><span>{{party.name}}</span><small>{{ responsibility(party) }}</small></button>}
      @if(!matches.length){<p>No matching {{label.toLowerCase()}}s</p>}
      @if(matchCount>30){<p>{{matchCount}} matches. Type more to narrow the list.</p>}
    </div>}
    @if(selected && !open){<small class="party-select__hint">{{responsibility(selected)}}</small>}
  </div>`,
  styles:[`:host{display:block;min-width:0}.party-select{position:relative;min-width:0}.party-select__control{position:relative}.party-select__control input{width:100%;padding-right:40px}.party-select__toggle{position:absolute;right:0;top:0;bottom:0;width:40px;border:0;background:transparent;color:var(--av-color-text-muted);cursor:pointer}.party-select__list{position:absolute;top:100%;left:0;right:0;z-index:80;max-height:240px;overflow-y:auto;border:1px solid var(--av-color-surface-border,#e1e7eb);border-radius:8px;background:var(--av-color-surface,#fff);box-shadow:var(--av-shadow-md);padding:4px}.party-select__list button{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:44px;padding:9px 10px;border:0;border-radius:4px;background:transparent;text-align:left;font:inherit;font-size:13px;cursor:pointer}.party-select__list button span{min-width:0;overflow-wrap:anywhere}.party-select__list small,.party-select__hint{color:var(--av-color-text-muted);font-size:11px}.party-select__list small{flex:0 0 auto}.party-select__list button:hover,.party-select__list button.is-highlighted{background:var(--av-color-primary-subtle,#eefbfc)}.party-select__list button[aria-disabled=true]{color:var(--av-color-text-muted);cursor:default}.party-select__list p{margin:8px;font-size:12px;color:var(--av-color-text-muted)}@media(max-width:400px){.party-select__list button{align-items:flex-start;flex-direction:column;gap:2px}}`],
})
export class InvoicePartySelectComponent implements OnChanges {
 @Input() parties:readonly InvoiceParty[]=[]
 @Input() role:InvoicePortalRole='supplier'
 @Input() label='Buyer'
 @Input() value=''
 @Output() valueChange=new EventEmitter<string>()
 readonly id='invoice-party-'+(++nextId)
 private readonly el:ElementRef<HTMLElement>=inject(ElementRef)
 query='';open=false;highlight=0
 ngOnChanges():void{if(!this.open)this.query=this.selected?.name??''}
 get selected(){return this.parties.find(p=>p.id===this.value)}
 get filtered(){const q=this.query.trim().toLowerCase();return this.parties.filter(p=>!q||p.name.toLowerCase().includes(q))}
 get matches(){return this.filtered.slice(0,30)}
 get matchCount(){return this.filtered.length}
 allowed(p:InvoiceParty){return canUploadFor(p,this.role)}
 responsibility(p:InvoiceParty){return this.allowed(p)?'You upload invoices':this.role==='supplier'?'Buyer uploads invoices':'Supplier uploads invoices'}
 show():void{if(!this.open){this.query='';this.highlight=0;this.open=true}}
 toggle():void{if(this.open)this.dismiss();else{this.show();this.el.nativeElement.querySelector('input')?.focus()}}
 search(value:string):void{this.query=value;this.open=true;this.highlight=0;this.valueChange.emit('')}
 choose(p:InvoiceParty):void{if(!this.allowed(p))return;this.value=p.id;this.query=p.name;this.open=false;this.valueChange.emit(p.id)}
 dismiss():void{this.open=false;this.query=this.selected?.name??''}
 key(e:KeyboardEvent):void{
  if(e.key==='Escape'&&this.open){e.preventDefault();e.stopPropagation();this.dismiss();return}
  if(e.key==='Tab'){this.dismiss();return}
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const wasOpen=this.open;this.show();this.highlight=wasOpen?Math.max(0,Math.min(this.matches.length-1,this.highlight+(e.key==='ArrowDown'?1:-1))):0;queueMicrotask(()=>this.el.nativeElement.querySelector('#'+this.id+'-option-'+this.highlight)?.scrollIntoView({block:'nearest'}))}
  if(e.key==='Enter'&&this.open){e.preventDefault();const p=this.matches[this.highlight];if(p)this.choose(p)}
 }
 @HostListener('document:click',['$event']) outside(e:Event):void{if(!this.el.nativeElement.contains(e.target as Node))this.dismiss()}
}
