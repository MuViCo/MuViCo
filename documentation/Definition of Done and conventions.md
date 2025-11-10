## Definition of Done and other conventions

### Testing:

- _Unit tests_ used when reasonable
- _End-to-end tests_ used when reasonable
- Manual / simulation-based testing can be enough for adjustments of the user interface
- Overall test coverage ought to be reasonably high

### Code maintainability:

- The code should follow mutually accepted linting standards
- The architecture is justified
  - Sensible folder structure
  - As a ground rule: one functionality per file
- Constants are well named

### Continuous integration

- _CI/CD_ pipe green
  - This checks for testing (coverage included), building, pushing into quay-io and linting
  - When issues are encountered, fixing them should be prioritized
- Only working code should be expected in the _main_ branch
- New code ought to be integrated via _pull requests_

### Merging new code to main branch

1. When a new feature is complete (working as expected, and CI/CD is green), create a pull request (PR) from the feature branch to the _main_ branch. In this PR, include details about the new functionalities.
2. Move the corresponding user story to IN REVIEW section in sprint backlog
3. Some other team member(s) must review this PR.
4. Once the PR is reviewed, the reviewer should verify that the _main_ branch is functioning correctly, and CI/CD is green
5. The reviewer moves corresponding user story to DONE section in sprint backlog

### Creating a new release

1. When the team wants the latest version of the _main_ branch to be integrated into the live version (muvico.live), they should create a new **release**. A new release should be made **consistently**, e.g. at the end of every sprint. If needed, urgent modifications of the live version can be published as releases at any time.
2. Start drafting a new release and create a new tag in the format `vMAJOR.MINOR.PATCH` accordingly:
  - If users can expect the functionality of the website or code to change drastically or their existing data or projects to stop working, bump to a new MAJOR.
      - Example: `v1.5.3` -> `v2.0.0`
  - If new features are added that are expected to be backwards-compatible with all existing functionalities, bump to a new MINOR.
      - Example: `v1.5.3` -> `v1.6.0`
  - If there have only been bug fixes or tweaks and no new features, bump to a new PATCH.
      - Example: `v1.5.3` -> `v1.5.4`
3. Set a title for the release in the format `MuViCo vX.Y.Z`, where `X.Y.Z` is the version of the release being made.
4. Create release notes for the release and set it as the latest, then publish it.

### User story size estimates

You can e.g. use the following, assuming backlog is in Github Projects:

| Size | Estimated Hours |
| ---- | --------------- |
| XL   | 30 h            |
| L    | 23 h            |
| M    | 15 h            |
| S    | 8 h             |
| XS   | 2 h             |

### Pull request template

https://cryptpad.fr/pad/#/2/pad/edit/GCJA0a8qIgjXZS+cYLJBiK5y/

### N.B. New functionality is always expected to correspond with a predetermined user story found in the backlog!

### Rebasing

https://www.geeksforgeeks.org/how-to-get-changes-from-master-into-a-branch-in-git/

Protip: before starting your coding day, rebase your branch onto main. This ensures you get the latest updates from main, and if conflicts arise, you have the whole day to go over them. DO NOT leave rebasing to the last day of the sprint. Nothing is worse than when you have your feature ready on the last day, and before making pull request you remember to rebase, and have only a couple of hours to resolve difficult conflicts.
