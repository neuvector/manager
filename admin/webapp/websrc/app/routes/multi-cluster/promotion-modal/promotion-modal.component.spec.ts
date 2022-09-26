import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { PromotionModalComponent } from "./promotion-modal.component";

describe("PromotionModalComponent", () => {
  let component: PromotionModalComponent;
  let fixture: ComponentFixture<PromotionModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PromotionModalComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PromotionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
