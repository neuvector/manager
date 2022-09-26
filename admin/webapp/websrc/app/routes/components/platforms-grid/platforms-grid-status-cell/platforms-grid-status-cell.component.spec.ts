import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatformsGridStatusCellComponent } from './platforms-grid-status-cell.component';

describe('PlatformsGridStatusCellComponent', () => {
  let component: PlatformsGridStatusCellComponent;
  let fixture: ComponentFixture<PlatformsGridStatusCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlatformsGridStatusCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlatformsGridStatusCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
