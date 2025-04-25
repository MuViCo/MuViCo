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

1. When a new feature is complete (working as expected, and CI/CD is green), create a pull request (PR) from the feature branch to the staging branch called **feature-merge-dev**.
2. Move the corresponding user story to IN REVIEW section in sprint backlog
3. Some other team member(s) must review this PR.
4. Once the PR is reviewed, the reviewer should verify that the **feature-merge-dev** branch is functioning correctly, and CI/CD is green
5. The reviewer then creates a new pull request from the **feature-merge-dev** branch to the main branch. In this new PR, include details about the new functionalities (these details can be referenced or copied from the original PR).
6. The reviewer merges this pull request into the main branch
7. The reviewer moves corresponding user story to DONE section in sprint backlog

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
