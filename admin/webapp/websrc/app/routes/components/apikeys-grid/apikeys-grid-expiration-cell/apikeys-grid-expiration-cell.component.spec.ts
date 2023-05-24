import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApikeysGridExpirationCellComponent } from './apikeys-grid-expiration-cell.component';

describe('ApikeysGridExpirationCellComponent', () => {
  let component: ApikeysGridExpirationCellComponent;
  let fixture: ComponentFixture<ApikeysGridExpirationCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApikeysGridExpirationCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApikeysGridExpirationCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
