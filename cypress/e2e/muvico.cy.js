describe("Frontpage", () => {
  it("can be found", () => {
    cy.visit(`${Cypress.env("baseUrl")}`)
    cy.contains("MuViCo")
  })
})
