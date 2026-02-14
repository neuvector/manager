import { Component } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';

/**
 * CardComponent extends the FieldType class from ngx-formly to create a custom form field component.
 * It is used to render a card-like UI element with customizable content and appearance based on form configuration.
 *
 * The component supports different severity levels for styling and can display content as either an array or a plain string.
 *
 * The `severity` input controls the appearance of the card:
 * - 'info': For informational messages.
 * - 'warning': For warning messages.
 * - 'error': For error messages.
 *
 * The card content can be:
 * - An array/object: Rendered either as a bulleted list or a normal list based on the `isBulletMode` flag.
 * - A plain string: Rendered within a `<pre>` tag to preserve formatting.
 *
 * The card outfit(border) can with shadow or not:
 * - Determined by `isPlainOutfitMode` flag.
 *
 * @example
 * Example usage with Formly configuration:
 *
 * export const field = {
 *   type: FormlyComponents.CARD,
 *   templateOptions: {
 *     header: 'Header Message',
 *     content: [
 *       'Content 1',
 *       'Content 2',
 *       'Content 3'
 *     ],
 *     isBulletMode: true,
 *     isPlainOutfitMode: false
 *     severity: CardSeverity.WARNING
 *   }
 * };
 */
@Component({
  standalone: false,
  selector: 'app-card',

  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
})
export class CardComponent extends FieldType<FieldTypeConfig> {
  isArrayContent(content: any): boolean {
    return Array.isArray(content);
  }

  isObjectContent(content: any): boolean {
    return content instanceof Object;
  }

  getObjectContentKeys(content: Object): string[] {
    return Object.keys(content);
  }
}
