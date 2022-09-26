import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesGridActionCellComponent } from './roles-grid-action-cell.component';

describe('RolesGridActionCellComponent', () => {
  let component: RolesGridActionCellComponent;
  let fixture: ComponentFixture<RolesGridActionCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RolesGridActionCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RolesGridActionCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
