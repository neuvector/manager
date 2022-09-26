import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistryModulesComponent } from './registry-modules.component';

describe('RegistryModulesComponent', () => {
  let component: RegistryModulesComponent;
  let fixture: ComponentFixture<RegistryModulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistryModulesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistryModulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
