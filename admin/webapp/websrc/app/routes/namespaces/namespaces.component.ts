import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Domain, ErrorResponse } from '@common/types';
import { NamespacesGridComponent } from '@components/namespaces-grid/namespaces-grid.component';
import { NamespacesService } from '@services/namespaces.service';
import { Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';


@Component({
  standalone: false,
  selector: 'app-namespaces',
  templateUrl: './namespaces.component.html',
  styleUrls: ['./namespaces.component.scss'],
  
})
export class NamespacesComponent implements OnInit {
  _namespacesGrid!: NamespacesGridComponent;
  @ViewChild(NamespacesGridComponent) set namespacesGrid(
    grid: NamespacesGridComponent
  ) {
    this._namespacesGrid = grid;
    if (this._namespacesGrid) {
      this._namespacesGrid.selectedNamespace$.subscribe(domain => {
        if (domain) this.selectedNamespace = domain;
      });
    }
  }
  get namespacesGrid() {
    return this._namespacesGrid;
  }
  refreshing$ = new Subject();
  error!: string;
  loaded = false;
  selectedNamespace!: Domain;

  constructor(
    private namespacesService: NamespacesService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getNamespaces();
  }

  refresh(): void {
    this.refreshing$.next(true);
    this.getNamespaces();
  }

  getNamespaces(): void {
    this.namespacesService.resetNamespaces();
    this.namespacesService
      .getNamespaces()
      .pipe(
        finalize(() => {
          this.loaded = true;
          this.refreshing$.next(false);
          this.cd.detectChanges();
        })
      )
      .subscribe({
        next: res => {
          this.namespacesService.namespaces = res;
          this.error = '';
          if (!this.loaded) this.loaded = true;
        },
        error: ({ error }: { error: ErrorResponse }) => {},
      });
  }
}
