import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistryDetailsTableAllViewComponent } from './registry-details-table-all-view.component';

describe('RegistryDetailsTableComponent', () => {
  let component: RegistryDetailsTableAllViewComponent;
  let fixture: ComponentFixture<RegistryDetailsTableAllViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistryDetailsTableAllViewComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistryDetailsTableAllViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
