import { Component, Input, ViewEncapsulation } from '@angular/core'
import { AvTooltipComponent } from '@avenews/design-system/angular'
@Component({
  selector:'app-invoice-help', standalone:true, imports:[AvTooltipComponent],
  template:`<av-tooltip [text]="text" [ariaLabel]="label" />`,
  encapsulation:ViewEncapsulation.None,
  styles:[`
    app-invoice-help{display:inline-flex;vertical-align:middle;margin-left:5px;font-size:inherit;line-height:0}
    app-invoice-help .av-tooltip__bubble{background:var(--av-color-text-heading,#0d343f);color:var(--av-color-surface,#fff);border:0;text-transform:none;font-weight:400;max-width:min(300px,calc(100vw - 24px))}
    /* The host-injected review toolbar must not intercept modal actions.
       Only Netlify review chrome is hidden, and only while an invoice dialog is open.
       Portal styling and the toolbar's normal closed-dialog position are unchanged. */
    body:has(app-invoice-upload [aria-modal="true"]) [data-netlify-deploy-id],
    body:has([data-product-context="invoice-financing"]):has(app-customer-financing-period-modal [aria-modal="true"]) [data-netlify-deploy-id],
    body:has(app-partner-workspace [aria-modal="true"]) [data-netlify-deploy-id]{visibility:hidden!important;pointer-events:none!important}
  `],
})
export class InvoiceHelpComponent { @Input() text=''; @Input() label='More information' }
