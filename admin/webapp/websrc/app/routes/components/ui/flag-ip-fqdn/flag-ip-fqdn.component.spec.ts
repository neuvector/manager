import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlagIpFqdnComponent } from './flag-ip-fqdn.component';

describe('FlagIpFqdnComponent', () => {
  let component: FlagIpFqdnComponent;
  let fixture: ComponentFixture<FlagIpFqdnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FlagIpFqdnComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FlagIpFqdnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
