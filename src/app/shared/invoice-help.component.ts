import { Component, Input, ViewEncapsulation } from '@angular/core'
import { AvTooltipComponent } from '@avenews/design-system/angular'
import { PortalTooltipOverlayDirective } from './portal-tooltip-overlay.directive'
@Component({
  selector:'app-invoice-help', standalone:true, imports:[AvTooltipComponent, PortalTooltipOverlayDirective],
  template:`<av-tooltip portalTooltipOverlay [text]="text" [ariaLabel]="label" />`,
  encapsulation:ViewEncapsulation.None,
  styles:[`
    app-invoice-help{display:inline-flex;vertical-align:middle;margin-left:5px;font-size:inherit;line-height:0}
    /* Header text uses uppercase cap height; raise only its inline help icon. */
    .baseline-table th app-invoice-help{position:relative;top:-2px}
    app-invoice-help .av-tooltip__bubble{background:var(--av-color-text-heading,#0d343f);color:var(--av-color-surface,#fff);border:0;text-transform:none;font-weight:400;max-width:min(300px,calc(100vw - 24px))}
    /* Only the bubble leaves the card's clipping context; its trigger stays inline.
       Preserve the installed design-system appearance, including the dark fill. */
    .av-tooltip__bubble.portal-tooltip-overlay{--av-tooltip-anchor:start;position:fixed!important;right:auto!important;bottom:auto!important;margin:0!important;transform:none!important;z-index:10000;box-sizing:border-box;overflow:auto;overflow-wrap:anywhere;overscroll-behavior:contain;background:var(--av-color-text-heading,#0d343f);color:var(--av-color-surface,#fff);border:0;font-weight:400;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    .av-tooltip__bubble.portal-tooltip-overlay[data-open]{visibility:visible!important;opacity:1!important;pointer-events:auto!important}
    .av-tooltip__bubble.portal-tooltip-overlay[data-body-overlay]:not([data-open]){display:none!important}
    .av-tooltip__bubble.portal-tooltip-overlay[data-body-overlay][data-open]{display:block!important}
    .portal-tooltip-overlay::backdrop{background:transparent;pointer-events:none}
    /* The host-injected review toolbar must not intercept modal actions.
       Only Netlify review chrome is hidden, and only while an invoice dialog is open.
       Portal styling and the toolbar's normal closed-dialog position are unchanged. */
    body:has(app-partner-rebate-modal [aria-modal="true"]) [data-netlify-deploy-id],
    body:has(app-invoice-upload [aria-modal="true"]) [data-netlify-deploy-id],
    body:has([data-product-context="invoice-financing"]):has(app-customer-financing-period-modal [aria-modal="true"]) [data-netlify-deploy-id],
    body:has(app-partner-workspace [aria-modal="true"]) [data-netlify-deploy-id]{visibility:hidden!important;pointer-events:none!important}
    /* On mobile the host toolbar covers the fixed product navigation as well.
       Keep both invoice portals reviewable without moving their original navigation. */
    @media(max-width:767px){
      body:has(.experience-bottom-nav__item[href^="/experience/invoice-financing/"]) [data-netlify-deploy-id],
      body:has(.experience-bottom-nav__item[href^="/experience/invoice-partner/"]) [data-netlify-deploy-id]{visibility:hidden!important;pointer-events:none!important}
    }
  `],
})
export class InvoiceHelpComponent { @Input() text=''; @Input() label='More information' }
