// https://docs.cypress.io/api/introduction/api.html

describe('Rapid Music', () => {
  it('ouvre le fil musical sur la racine', () => {
    cy.visit('/')
    cy.contains('ion-content', 'Ton fil musical')
  })
})
