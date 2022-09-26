import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeBriefDialogComponent } from './node-brief-dialog.component';

describe('NodeBriefDialogComponent', () => {
  let component: NodeBriefDialogComponent;
  let fixture: ComponentFixture<NodeBriefDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NodeBriefDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeBriefDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
