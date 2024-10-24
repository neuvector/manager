import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodesGridComponent } from './nodes-grid.component';

describe('NodesGridComponent', () => {
  let component: NodesGridComponent;
  let fixture: ComponentFixture<NodesGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NodesGridComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NodesGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
