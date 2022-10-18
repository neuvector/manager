import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiSelectorDropdownComponent } from './multi-selector-dropdown.component';

describe('MultiSelectorDropdownComponent', () => {
  let component: MultiSelectorDropdownComponent;
  let fixture: ComponentFixture<MultiSelectorDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MultiSelectorDropdownComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MultiSelectorDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
