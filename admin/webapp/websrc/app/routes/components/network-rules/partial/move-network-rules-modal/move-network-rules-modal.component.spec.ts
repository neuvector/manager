import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveNetworkRulesModalComponent } from './move-network-rules-modal.component';

describe('MoveNetworkRulesModalComponent', () => {
  let component: MoveNetworkRulesModalComponent;
  let fixture: ComponentFixture<MoveNetworkRulesModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MoveNetworkRulesModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MoveNetworkRulesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
