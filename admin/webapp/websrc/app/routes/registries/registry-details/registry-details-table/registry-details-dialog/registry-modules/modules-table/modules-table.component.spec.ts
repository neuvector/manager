import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModulesTableComponent } from './modules-table.component';

describe('ModulesTableComponent', () => {
  let component: ModulesTableComponent;
  let fixture: ComponentFixture<ModulesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModulesTableComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModulesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
