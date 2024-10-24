import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupDlpConfigActionButtonComponent } from './group-dlp-config-action-button.component';

describe('GroupDlpConfigActionButtonComponent', () => {
  let component: GroupDlpConfigActionButtonComponent;
  let fixture: ComponentFixture<GroupDlpConfigActionButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GroupDlpConfigActionButtonComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupDlpConfigActionButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
