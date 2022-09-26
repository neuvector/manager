import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistryDetailsTableComponent } from './registry-details-table.component';

describe('RegistryDetailsTableComponent', () => {
  let component: RegistryDetailsTableComponent;
  let fixture: ComponentFixture<RegistryDetailsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistryDetailsTableComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistryDetailsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
