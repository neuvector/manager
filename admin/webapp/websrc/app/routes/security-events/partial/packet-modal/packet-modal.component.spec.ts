import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PacketModalComponent } from './packet-modal.component';

describe('PacketModalComponent', () => {
  let component: PacketModalComponent;
  let fixture: ComponentFixture<PacketModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PacketModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PacketModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
