import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationConversationChartComponent } from './application-conversation-chart.component';

describe('ApplicationConversationChartComponent', () => {
  let component: ApplicationConversationChartComponent;
  let fixture: ComponentFixture<ApplicationConversationChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApplicationConversationChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationConversationChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
