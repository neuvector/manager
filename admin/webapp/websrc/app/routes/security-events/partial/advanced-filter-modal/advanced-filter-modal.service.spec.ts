import { TestBed } from '@angular/core/testing';

import { AdvancedFilterModalService } from './advanced-filter-modal.service';

describe('AdvancedFilterModalService', () => {
  let service: AdvancedFilterModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdvancedFilterModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
