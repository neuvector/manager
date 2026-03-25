import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistryDetailsOsCell } from './registry-details-os-cell';

describe('RegistryDetailsOsCell', () => {
  let component: RegistryDetailsOsCell;
  let fixture: ComponentFixture<RegistryDetailsOsCell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistryDetailsOsCell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistryDetailsOsCell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
