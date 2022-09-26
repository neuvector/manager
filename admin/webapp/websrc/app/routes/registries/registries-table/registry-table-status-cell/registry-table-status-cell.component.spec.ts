import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistryTableStatusCellComponent } from './registry-table-status-cell.component';

describe('RegistryTableStatusCellComponent', () => {
  let component: RegistryTableStatusCellComponent;
  let fixture: ComponentFixture<RegistryTableStatusCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistryTableStatusCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistryTableStatusCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
