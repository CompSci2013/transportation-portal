# CHANGE REQUEST AMENDMENT

**Original CR:** CR-2025-002  
**Amendment ID:** CR-2025-002-AMENDMENT-001  
**Date:** 2025-10-05  
**Reason:** Technology Substitution (Licensing Issue)

## Summary of Change

**Original Approach:** Integrate PrimeNG Table component  
**Revised Approach:** Integrate NG-ZORRO Table component

## Reason for Deviation

During Phase 1 implementation, discovered PrimeNG 13.4+ displays licensing banner requiring $590/year commercial license. This was not disclosed in initial evaluation.

**Options Evaluated:**
1. Purchase PrimeNG license ($590/year recurring cost)
2. Downgrade to PrimeNG 13.3.3 (no security updates, abandoned version)
3. Migrate to NG-ZORRO (MIT licensed, Alibaba-backed, actively maintained)

**Decision:** Option 3 - NG-ZORRO migration

## Impact Analysis

**Scope:** Changed (different library API)  
**Timeline:** +3 hours (research + migration)  
**Budget:** $0 (avoided $590/year cost)  
**Risk:** Reduced (MIT license vs commercial)  
**Quality:** Equal (all features implemented)

## Revised Deliverables

All original CR-2025-002 acceptance criteria met using NG-ZORRO instead of PrimeNG.

## Stakeholder Approval

**Approved by:** ________________  
**Date:** ________________  

**Rationale:** Avoided recurring licensing cost, reduced long-term risk, maintained all functionality.
