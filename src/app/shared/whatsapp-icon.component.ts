import { ChangeDetectionStrategy, Component } from '@angular/core'

/** Exact outline WhatsApp glyph used by the previous customer portal prototype. */
@Component({
  selector: 'app-whatsapp-icon',
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 21l1.65-4.95A9 9 0 1 1 8 19.5L3 21z" />
      <path d="M8.5 9c0 .5.5 2 2 3.5s3 2 3.5 2c.5 0 1.5-.5 1.5-1.5 0-.4-.25-.6-.5-.75l-1.25-.6c-.3-.15-.6-.05-.8.2l-.45.55c-1-.4-1.85-1.25-2.25-2.25l.55-.45c.25-.2.35-.5.2-.8l-.6-1.25c-.15-.25-.35-.5-.75-.5C9 7.5 8.5 8.5 8.5 9z" />
    </svg>
  `,
  styles: [':host { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsAppIconComponent {}
