import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupDlpConfigModalComponent } from './group-dlp-config-modal.component';

describe('GroupDlpConfigModalComponent', () => {
  let component: GroupDlpConfigModalComponent;
  let fixture: ComponentFixture<GroupDlpConfigModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GroupDlpConfigModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupDlpConfigModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
