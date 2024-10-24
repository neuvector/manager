import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupDlpComponent } from './group-dlp.component';

describe('GroupDlpComponent', () => {
  let component: GroupDlpComponent;
  let fixture: ComponentFixture<GroupDlpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GroupDlpComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupDlpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
