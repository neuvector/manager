import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditWebhookTableControlsComponent } from './edit-webhook-table-controls.component';

describe('EditWebhookTableControlsComponent', () => {
  let component: EditWebhookTableControlsComponent;
  let fixture: ComponentFixture<EditWebhookTableControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditWebhookTableControlsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditWebhookTableControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
