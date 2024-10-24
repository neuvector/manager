import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkActivitiesComponent } from './network-activities.component';

describe('NetworkActivitiesComponent', () => {
  let component: NetworkActivitiesComponent;
  let fixture: ComponentFixture<NetworkActivitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NetworkActivitiesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkActivitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
