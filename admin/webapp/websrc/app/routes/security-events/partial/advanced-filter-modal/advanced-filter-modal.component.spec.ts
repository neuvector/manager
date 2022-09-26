import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvancedFilterModalComponent } from './advanced-filter-modal.component';

describe('AdvancedFilterModalComponent', () => {
  let component: AdvancedFilterModalComponent;
  let fixture: ComponentFixture<AdvancedFilterModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdvancedFilterModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdvancedFilterModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
