import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistriesTableComponent } from './registries-table.component';

describe('RegistriesTableComponent', () => {
  let component: RegistriesTableComponent;
  let fixture: ComponentFixture<RegistriesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistriesTableComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistriesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
