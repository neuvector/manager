import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiClusterGridComponent } from './multi-cluster-grid.component';

describe('MultiClusterGridComponent', () => {
  let component: MultiClusterGridComponent;
  let fixture: ComponentFixture<MultiClusterGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MultiClusterGridComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MultiClusterGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
