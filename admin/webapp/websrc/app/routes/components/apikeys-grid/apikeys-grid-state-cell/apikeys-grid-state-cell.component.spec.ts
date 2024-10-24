import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApikeysGridStateCellComponent } from './apikeys-grid-state-cell.component';

describe('ApikeysGridStateCellComponent', () => {
  let component: ApikeysGridStateCellComponent;
  let fixture: ComponentFixture<ApikeysGridStateCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ApikeysGridStateCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApikeysGridStateCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
