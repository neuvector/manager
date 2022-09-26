import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupDomainRoleComponent } from './group-domain-role.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { GroupDomainRoleDialogComponent } from './group-domain-role-dialog/group-domain-role-dialog.component';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { TranslateModule } from '@ngx-translate/core';
import { GroupDomainRoleTableComponent } from './group-domain-role-table/group-domain-role-table.component';

@NgModule({
  declarations: [
    GroupDomainRoleComponent,
    GroupDomainRoleDialogComponent,
    GroupDomainRoleTableComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    MatSortModule,
    MatTableModule,
    MatSelectModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatAutocompleteModule,
    DragDropModule,
  ],
  exports: [
    GroupDomainRoleComponent,
    GroupDomainRoleDialogComponent,
    GroupDomainRoleTableComponent,
  ],
})
export class GroupDomainRoleModule {}
