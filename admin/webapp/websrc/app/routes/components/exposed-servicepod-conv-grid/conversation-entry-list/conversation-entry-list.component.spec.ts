import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationEntryListComponent } from './conversation-entry-list.component';

describe('ConversationEntryListComponent', () => {
  let component: ConversationEntryListComponent;
  let fixture: ComponentFixture<ConversationEntryListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConversationEntryListComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversationEntryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
