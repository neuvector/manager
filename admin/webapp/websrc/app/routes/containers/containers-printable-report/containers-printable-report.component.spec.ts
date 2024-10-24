import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainersPrintableReportComponent } from './containers-printable-report.component';

describe('ContainersPrintableReportComponent', () => {
  let component: ContainersPrintableReportComponent;
  let fixture: ComponentFixture<ContainersPrintableReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContainersPrintableReportComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContainersPrintableReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
