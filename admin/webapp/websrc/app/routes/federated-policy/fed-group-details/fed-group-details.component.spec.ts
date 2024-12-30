import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FedGroupDetailsComponent } from './fed-group-details.component';

describe('FedGroupDetailsComponent', () => {
  let component: FedGroupDetailsComponent;
  let fixture: ComponentFixture<FedGroupDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FedGroupDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FedGroupDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
