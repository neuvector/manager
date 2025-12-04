import { Directive, TemplateRef, ViewContainerRef, Input } from '@angular/core';
import { AuthUtilsService } from '@common/utils/auth.utils';

@Directive({
  selector: '[appDisplayControl]',
  standalone: false,
})
export class DisplayControlDirective {
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authUtils: AuthUtilsService
  ) {}

  @Input() set appDisplayControl(displayControl: String) {
    if (this.authUtils.getDisplayFlag(displayControl)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
