import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VulnerabilitiesGridFeedRatingCellComponent } from './vulnerabilities-grid-feed-rating-cell.component';

describe('VulnerabilitiesGridFeedRatingCellComponent', () => {
  let component: VulnerabilitiesGridFeedRatingCellComponent;
  let fixture: ComponentFixture<VulnerabilitiesGridFeedRatingCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VulnerabilitiesGridFeedRatingCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VulnerabilitiesGridFeedRatingCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
