import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModulesChartsComponent } from './modules-charts.component';

describe('ModulesChartsComponent', () => {
  let component: ModulesChartsComponent;
  let fixture: ComponentFixture<ModulesChartsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModulesChartsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModulesChartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
