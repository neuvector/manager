import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebhooksComponent } from './webhooks.component';

describe('WebhooksComponent', () => {
  let component: WebhooksComponent;
  let fixture: ComponentFixture<WebhooksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WebhooksComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WebhooksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
