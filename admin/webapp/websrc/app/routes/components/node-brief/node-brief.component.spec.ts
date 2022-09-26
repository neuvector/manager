import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeBriefComponent } from './node-brief.component';

describe('NodeBriefComponent', () => {
  let component: NodeBriefComponent;
  let fixture: ComponentFixture<NodeBriefComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NodeBriefComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeBriefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
