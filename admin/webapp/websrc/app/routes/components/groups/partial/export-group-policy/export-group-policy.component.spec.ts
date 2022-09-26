import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportGroupPolicyComponent } from './export-group-policy.component';

describe('ExportGroupPolicyComponent', () => {
  let component: ExportGroupPolicyComponent;
  let fixture: ComponentFixture<ExportGroupPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExportGroupPolicyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExportGroupPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
