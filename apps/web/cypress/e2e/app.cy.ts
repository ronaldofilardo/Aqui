describe("Login", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("deve exibir formulário de login", () => {
    cy.get("input[type='email']").should("exist");
    cy.get("input[type='password']").should("exist");
    cy.get("button[type='submit']").should("exist");
  });

  it("deve rejeitar credenciais inválidas", () => {
    cy.get("input[type='email']").type("wrong@test.com");
    cy.get("input[type='password']").type("wrongpass");
    cy.get("button[type='submit']").click();
    cy.contains("Credenciais inválidas").should("be.visible");
  });
});

describe("Rotas protegidas", () => {
  it("deve redirecionar gestor não autenticado", () => {
    cy.visit("/gestor/dashboard");
    cy.url().should("include", "/login");
  });

  it("deve redirecionar consultor não autenticado", () => {
    cy.visit("/consultor/estabelecimentos");
    cy.url().should("include", "/login");
  });
});

describe("Validação pública de cupom", () => {
  it("deve mostrar erro para cupom inexistente", () => {
    cy.visit("/cupom/INVALIDO-999");
    cy.contains("Cupom Inválido").should("be.visible");
  });
});
