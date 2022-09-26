import { TestBed } from '@angular/core/testing';

import { ComplianceProfileService } from './compliance-profile.service';

describe('ComplianceProfileService', () => {
  let service: ComplianceProfileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComplianceProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
