import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiClusterGridActionCellComponent } from './multi-cluster-grid-action-cell.component';

describe('MultiClusterGridActionCellComponent', () => {
  let component: MultiClusterGridActionCellComponent;
  let fixture: ComponentFixture<MultiClusterGridActionCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MultiClusterGridActionCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MultiClusterGridActionCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
