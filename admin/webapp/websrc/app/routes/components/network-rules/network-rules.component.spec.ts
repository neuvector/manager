import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkRulesComponent } from './network-rules.component';

describe('NetworkRulesComponent', () => {
  let component: NetworkRulesComponent;
  let fixture: ComponentFixture<NetworkRulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NetworkRulesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
