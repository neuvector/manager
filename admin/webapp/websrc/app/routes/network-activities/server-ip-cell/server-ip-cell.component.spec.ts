import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerIpCellComponent } from './server-ip-cell.component';

describe('ServerIpCellComponent', () => {
  let component: ServerIpCellComponent;
  let fixture: ComponentFixture<ServerIpCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ServerIpCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerIpCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
