import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickFilterComponent } from './quick-filter.component';

describe('QuickFilterComponent', () => {
  let component: QuickFilterComponent;
  let fixture: ComponentFixture<QuickFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QuickFilterComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuickFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
