import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExposurePanelComponent } from './exposure-panel.component';

describe('ExposurePanelComponent', () => {
  let component: ExposurePanelComponent;
  let fixture: ComponentFixture<ExposurePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExposurePanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExposurePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
