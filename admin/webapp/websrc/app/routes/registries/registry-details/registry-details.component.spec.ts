import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistryDetailsComponent } from './registry-details.component';

describe('RegistryDetailsComponent', () => {
  let component: RegistryDetailsComponent;
  let fixture: ComponentFixture<RegistryDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistryDetailsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistryDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
