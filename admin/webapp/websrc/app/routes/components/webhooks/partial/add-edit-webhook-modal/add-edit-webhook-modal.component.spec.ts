import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditWebhookModalComponent } from './add-edit-webhook-modal.component';

describe('AddEditWebhookModalComponent', () => {
  let component: AddEditWebhookModalComponent;
  let fixture: ComponentFixture<AddEditWebhookModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEditWebhookModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditWebhookModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
