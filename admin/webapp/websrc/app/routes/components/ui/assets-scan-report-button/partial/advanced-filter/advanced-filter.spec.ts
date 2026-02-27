import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvancedFilter } from './advanced-filter';

describe('AdvancedFilter', () => {
  let component: AdvancedFilter;
  let fixture: ComponentFixture<AdvancedFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdvancedFilter],
    }).compileComponents();

    fixture = TestBed.createComponent(AdvancedFilter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
