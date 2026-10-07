import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { PortalActionIconComponent } from './portal-action-icon.component'
import { INVOICE_UPLOAD_LEGAL } from '../core/experience/invoice-upload-legal.data'
import { AuthService } from '../core/auth/auth.service'
import { InvoiceDocumentsStore, INVOICE_EXTENSIONS, INVOICE_DELIVERY_DECLARATION, invoiceParties, canUploadFor, type InvoicePortalRole, type UploadSection, type InvoiceSubmission, type ManualInvoiceInput, type InvoiceProcessingMode } from '../core/experience/invoice-portal.data'
import { InvoicePartySelectComponent } from './invoice-party-select.component'
import { InvoiceDialogFocusDirective } from './invoice-dialog-focus.directive'
@Component({selector:'app-invoice-upload',standalone:true,imports:[FormsModule,InvoicePartySelectComponent,InvoiceDialogFocusDirective,PortalActionIconComponent],templateUrl:'./invoice-upload.component.html',styleUrl:'./invoice-upload.component.css'})
export class InvoiceUploadComponent implements OnInit {
 @Input() role:InvoicePortalRole='supplier'
 @Input() partyId=''
 @Output() close=new EventEmitter<void>()
 @Output() submitted=new EventEmitter<InvoiceSubmission>()
 @Output() invoicesRequested=new EventEmitter<void>()
 readonly store=inject(InvoiceDocumentsStore)
 private readonly auth=inject(AuthService)
 private readonly router=inject(Router)
 readonly deliveryDeclaration=INVOICE_DELIVERY_DECLARATION
 readonly legal=INVOICE_UPLOAD_LEGAL
 confirmedAt=''
 sections:UploadSection[]=[];automaticFiles:File[]=[];confirmed=false;error='';discard=false;receipt:InvoiceSubmission|null=null;saving=false
 private sequence=0
 private invoiceSequence=0
 ngOnInit():void{const selected=this.availableParties.find(p=>p.id===this.partyId);this.sections=[this.newSection(selected?.id??'')]}
 get label(){return this.role==='supplier'?'Buyer':'Supplier'}
 get parties(){return invoiceParties(this.role)}
 get availableParties(){return this.parties.filter(p=>canUploadFor(p,this.role))}
 get accept(){return INVOICE_EXTENSIONS.map(extension=>'.'+extension).join(',')}
 get processingMode():InvoiceProcessingMode{return this.role==='partner'?'automatic':'manual'}
 get automaticMode(){return this.processingMode==='automatic'}
 get needsDeliveryInstructions(){return this.sections.some(section=>this.requiresPod(section))}
 newInvoice():ManualInvoiceInput{return{id:++this.invoiceSequence,reference:'',amount:null,file:null}}
 newSection(partyId=''):UploadSection{return{id:++this.sequence,partyId,dueDate:'',invoices:[this.newInvoice()],delivery:[]}}
 add():void{if(this.sections.length<20)this.sections.push(this.newSection());this.changed()}
 copy(s:UploadSection):void{if(this.sections.length<20)this.sections.push({...this.newSection(s.partyId),dueDate:s.dueDate});this.changed()}
 remove(s:UploadSection):void{if(this.sections.length>1)this.sections=this.sections.filter(i=>i.id!==s.id);this.changed()}
 requiresPod(s:UploadSection):boolean{return this.parties.find(p=>p.id===s.partyId)?.pod??false}
 changed():void{this.confirmed=false;this.confirmedAt='';this.error=''}
 confirmationChanged(value:boolean):void{this.confirmed=value;this.confirmedAt=value?new Date().toISOString():''}
 viewInvoices():void{this.invoicesRequested.emit();this.close.emit();void this.router.navigate(['/experience',this.role==='supplier'?'invoice-financing':'invoice-partner',this.role==='supplier'?'invoices':'invoice-uploads'])}
 partyChanged(s:UploadSection,value:string):void{if(s.partyId===value)return;s.partyId=value;this.changed()}
 addInvoice(s:UploadSection):void{if(s.invoices.length<10)s.invoices=[...s.invoices,this.newInvoice()];this.changed()}
 removeInvoice(s:UploadSection,invoice:ManualInvoiceInput):void{if(s.invoices.length>1)s.invoices=s.invoices.filter(item=>item.id!==invoice.id);this.changed()}
 invoiceChanged():void{this.changed()}
 chooseInvoiceFile(invoice:ManualInvoiceInput,event:Event):void{const input=event.target as HTMLInputElement;invoice.file=input.files?.[0]??null;input.value='';this.changed()}
 removeInvoiceFile(invoice:ManualInvoiceInput):void{invoice.file=null;this.changed()}
 addDeliveryFiles(s:UploadSection,event:Event):void{const input=event.target as HTMLInputElement;s.delivery=[...s.delivery,...Array.from(input.files??[])];input.value='';this.changed()}
 removeDeliveryFile(s:UploadSection,index:number):void{s.delivery=s.delivery.filter((_,i)=>i!==index);this.changed()}
 addAutomaticFiles(event:Event):void{const input=event.target as HTMLInputElement;this.automaticFiles=[...this.automaticFiles,...Array.from(input.files??[])];input.value='';this.changed()}
 removeAutomaticFile(index:number):void{this.automaticFiles=this.automaticFiles.filter((_,i)=>i!==index);this.changed()}
 requestClose():void{if(!this.receipt&&(this.automaticFiles.length||this.sections.some(s=>s.invoices.some(invoice=>invoice.reference||invoice.amount!==null||invoice.file)||s.delivery.length||s.dueDate)))this.discard=true;else this.close.emit()}
 submit():void{
  if(this.saving||this.receipt)return
  this.saving=true
  try{const actor=this.auth.getSession();if(!actor)throw new Error('Please sign in again before submitting invoices.');this.receipt=this.automaticMode?this.store.saveAutomatic(this.automaticFiles,actor.contactId,actor.contactFirstName+' '+actor.contactLastName,this.confirmed,this.confirmedAt):this.store.save(this.sections,this.role,actor.contactId,actor.contactFirstName+' '+actor.contactLastName,this.confirmed,this.confirmedAt);this.error='';this.submitted.emit(this.receipt)}
  catch(e){this.error=e instanceof Error?e.message:'Unable to add these invoices. Please try again.'}
  finally{this.saving=false}
 }
}
