import { AfterViewInit, Directive, ElementRef, EventEmitter, HostListener, OnDestroy, Output, inject } from '@angular/core'
@Directive({selector:'[invoiceDialogFocus]',standalone:true})
export class InvoiceDialogFocusDirective implements AfterViewInit, OnDestroy {
  private readonly el:ElementRef<HTMLElement>=inject(ElementRef)
  private opener=document.activeElement as HTMLElement|null
  private previousOverflow=''
  @Output() dialogEscape=new EventEmitter<void>()
  ngAfterViewInit():void {this.previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';queueMicrotask(()=>this.el.nativeElement.querySelector<HTMLElement>('button,input,select,[tabindex="0"]')?.focus())}
  @HostListener('keydown',['$event']) key(event:KeyboardEvent):void {
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();this.dialogEscape.emit();return}
    if(event.key!=='Tab')return
    const items=Array.from(this.el.nativeElement.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea,[tabindex="0"]')).filter(e=>e.getClientRects().length&&e.tabIndex>=0)
    const first=items[0],last=items[items.length-1]
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
    if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
  }
  ngOnDestroy():void {document.body.style.overflow=this.previousOverflow;if(this.opener?.isConnected)this.opener.focus()}
}
