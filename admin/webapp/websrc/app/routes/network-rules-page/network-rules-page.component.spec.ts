import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkRulesPageComponent } from './network-rules-page.component';

describe('NetworkRulesPageComponent', () => {
  let component: NetworkRulesPageComponent;
  let fixture: ComponentFixture<NetworkRulesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NetworkRulesPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkRulesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
