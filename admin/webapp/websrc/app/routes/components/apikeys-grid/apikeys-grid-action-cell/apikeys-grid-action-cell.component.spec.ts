import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApikeysGridActionCellComponent } from './apikeys-grid-action-cell.component';

describe('ApikeysGridActionCellComponent', () => {
  let component: ApikeysGridActionCellComponent;
  let fixture: ComponentFixture<ApikeysGridActionCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ApikeysGridActionCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApikeysGridActionCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
