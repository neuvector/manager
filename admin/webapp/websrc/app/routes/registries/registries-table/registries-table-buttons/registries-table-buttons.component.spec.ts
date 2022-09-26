import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistriesTableButtonsComponent } from './registries-table-buttons.component';

describe('RegistriesTableButtonsComponent', () => {
  let component: RegistriesTableButtonsComponent;
  let fixture: ComponentFixture<RegistriesTableButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistriesTableButtonsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistriesTableButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
