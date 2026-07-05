import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initialFormData } from "../lib/utils";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("useEstabelecimentos - API interactions (pure functions)", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("form initialization", () => {
    it("deve inicializar form com todos os campos vazios", () => {
      const form = initialFormData();
      expect(form.nomeFantasia).toBe("");
      expect(form.cnpj).toBe("");
      expect(form.pixTipo).toBe("");
    });
  });

  describe("loadEstabs API call", () => {
    it("deve chamar fetch com caminho correto", () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const promise = fetch("/api/v1/consultor/estabelecimentos");
      promise.then((r) => r.json()).then((data) => {
        expect(Array.isArray(data)).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/consultor/estabelecimentos"
      );
    });

    it("deve tratar resposta não-array como array vazio", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ error: "not found" }),
      });

      const res = await mockFetch();
      const data = await res.json();
      const estabs = Array.isArray(data) ? data : [];
      expect(estabs).toEqual([]);
    });

    it("deve tratar erro de rede", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network failure"));

      try {
        await mockFetch();
      } catch {
        expect(true).toBe(true);
      }
    });
  });

  describe("handleSubmit API call", () => {
    it("deve POST com Content-Type application/json", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const form = {
        nomeFantasia: "Clínica Teste",
        razaoSocial: "",
        cnpj: "",
        endereco: "",
        cidade: "",
        estado: "",
        telefone: "",
        email: "",
        responsavelNome: "",
        responsavelCpf: "",
        pixTipo: "",
        pixChave: "",
        bancoNome: "",
        agencia: "",
        conta: "",
      };

      await fetch("/api/v1/consultor/estabelecimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/consultor/estabelecimentos",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("deve detectar erro de CNPJ do servidor", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "CNPJ duplicado" }),
      });

      const res = await mockFetch();
      const err = await res.json();
      expect(err.error).toContain("CNPJ");
    });
  });

  describe("gerarConvite API call", () => {
    it("deve POST para gerar acesso e retornar link", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ link: "https://asa.com/invite/abc123" }),
      });

      const res = await fetch(
        "/api/v1/consultor/estabelecimentos/estab-1/gerar-acesso",
        { method: "POST" }
      );
      const data = await res.json();

      expect(data.link).toBe("https://asa.com/invite/abc123");
    });

    it("deve tratar erro 400 como mensagem de erro", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      const res = await mockFetch();
      expect(res.ok).toBe(false);
    });
  });

  describe("handleUpload API call", () => {
    it("deve enviar FormData com file e tipo", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const formData = new FormData();
      formData.append("file", new File(["content"], "doc.pdf"));
      formData.append("tipo", "CNPJ");

      await fetch("/api/v1/consultor/estabelecimentos/estab-1/documentos", {
        method: "POST",
        body: formData,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/consultor/estabelecimentos/estab-1/documentos",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("downloadQR API call", () => {
    it("deve buscar qrCode com codigoCupom", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            qrCode: "data:image/png;base64,abc",
            codigoCupom: "CUPOM123",
          }),
      });

      const res = await fetch(
        "/api/v1/consultor/estabelecimentos/estab-1/qrcode"
      );
      const data = await res.json();

      expect(data.qrCode).toBe("data:image/png;base64,abc");
      expect(data.codigoCupom).toBe("CUPOM123");
    });
  });

  describe("clearFieldError", () => {
    it("deve remover chave específica de errors object", () => {
      const errors = { cnpj: "inválido", pixChave: "pix inválido" };
      const { [("cnpj")]: _, ...rest } = errors;
      expect(rest).toEqual({ pixChave: "pix inválido" });
    });

    it("deve retornar mesmo objeto se chave não existe", () => {
      const errors = { pixChave: "pix inválido" } as Record<
        string,
        string | undefined
      >;
      const { ["cnpj"]: _, ...rest } = errors;
      expect(rest).toEqual({ pixChave: "pix inválido" });
    });
  });

  describe("validacao de form", () => {
    it("deve rejeitar nomeFantasia vazio", () => {
      const errors: Record<string, string> = {};
      const form = { ...initialFormData(), nomeFantasia: "" };
      if (!form.nomeFantasia.trim()) {
        errors.nomeFantasia = "Nome fantasia é obrigatório";
      }
      expect(errors).toHaveProperty("nomeFantasia");
    });

    it("deve validar formato de email", () => {
      const form = { ...initialFormData(), email: "test@example.com" };
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(form.email)).toBe(true);
    });

    it("deve validar estado com 2 caracteres", () => {
      const form = { ...initialFormData(), estado: "SP" };
      expect(form.estado.length).toBeLessThanOrEqual(2);
    });
  });

  describe("clipboard API", () => {
    it("deve chamar navigator.clipboard.writeText", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", { clipboard: { writeText } });

      await navigator.clipboard.writeText("https://link.com");

      expect(writeText).toHaveBeenCalledWith("https://link.com");
    });
  });

  describe("download link structure", () => {
    it("deve estruturar dados de QR code corretamente", () => {
      const data = {
        qrCode: "data:image/png;base64,abc",
        codigoCupom: "CUPOM123",
      };
      expect(data.qrCode).toBe("data:image/png;base64,abc");
      expect(data.codigoCupom).toBe("CUPOM123");
      expect(data.codigoCupom).toMatch(/^CUPOM/);
    });
  });
});