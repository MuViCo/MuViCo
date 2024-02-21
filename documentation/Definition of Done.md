## Definition of Done

---

#### Testing:
- *Unit tests* used when reasonable
- *End-to-end tests* used when reasonable
- Manual / simulation-based testing can be enough for adjustments of the user interface
- Overall test coverage ought to be reasonably high

#### Code maintainability:
- The code should follow mutually accepted linting standards
- The architecture is justified
  - Sensible folder structure
  - As a ground rule: one functionality per file
- Constants are well named

#### Continuous integration
- *CI/CD* pipe green
  - This checks for testing (coverage included), building, pushing into quay-io and linting
  - When issues are encountered, fixing them should be prioritized
- Only working code should be expected in the *main* branch
- New code ought to be integrated via *pull requests*

#### New functionality is always expected to correspond with a predetermined user story found in the backlog!
