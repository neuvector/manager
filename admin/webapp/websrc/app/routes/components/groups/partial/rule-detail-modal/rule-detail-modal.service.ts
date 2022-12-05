import { MatDialogRef } from '@angular/material/dialog';

export class RuleDetailModalService {
  isDialogOpen: boolean =false;
  ruleDialog: MatDialogRef<any>;
  constructor() {}
}
