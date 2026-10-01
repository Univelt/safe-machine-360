export type FriendlyError = {
  code: string;
  title: string;
  message: string;
  nextStep: string;
  reference?: string;
};

export type ActionFailure = { ok: false; error: FriendlyError };
export type FormActionResult = void | ActionFailure;

// Only messages written by the application may be shown verbatim.
export class UserFacingError extends Error {
  constructor(message: string, public code = "DADOS_INVALIDOS") {
    super(message);
    this.name = "UserFacingError";
  }
}

export function isActionFailure(value: unknown): value is ActionFailure {
  return Boolean(value && typeof value === "object" && "ok" in value && value.ok === false && "error" in value && value.error && typeof value.error === "object" && "code" in value.error);
}

export function describeError(error: unknown): FriendlyError {
  if (error instanceof UserFacingError) {
    const permission = /permissão|somente|administradores/i.test(error.message);
    const missing = /não encontrad|sem acesso/i.test(error.message);
    return {
      code: permission ? "ACESSO_RESTRITO" : missing ? "REGISTRO_NAO_ENCONTRADO" : error.code,
      title: permission ? "Você não pode realizar esta ação" : missing ? "Não encontramos este registro" : "Revise os dados informados",
      message: error.message,
      nextStep: permission ? "Se precisar realizar esta ação, fale com o administrador da sua empresa." : missing ? "Volte à lista e confira se o registro ainda está disponível para você." : "Corrija o campo indicado e tente novamente.",
    };
  }
  const data = error && typeof error === "object" ? error as { code?: unknown; name?: unknown; message?: unknown; meta?: { target?: unknown } } : {};
  if (data.code === "P2002") {
    const target = Array.isArray(data.meta?.target) ? data.meta.target.join(" ") : String(data.meta?.target ?? "");
    const machineCode = target.includes("companyId") && target.includes("code");
    return {
      code: machineCode ? "CODIGO_MAQUINA_DUPLICADO" : "DADOS_DUPLICADOS",
      title: "Este dado já está cadastrado",
      message: machineCode ? "Outra máquina desta empresa já utiliza esse código." : target.includes("email") ? "Já existe um usuário com esse e-mail." : "Um dos dados informados já está em uso em outro cadastro.",
      nextStep: machineCode ? "Informe um código exclusivo para esta máquina e salve novamente." : "Confira o cadastro existente ou informe um valor diferente.",
    };
  }
  if (data.code === "P2025" || data.name === "NoSuchKey" || data.code === "ENOENT") {
    return { code: "REGISTRO_NAO_ENCONTRADO", title: "Não encontramos o registro ou arquivo", message: "O item pode ter sido removido ou alterado por outra pessoa.", nextStep: "Volte à lista e confira se o item ainda está disponível." };
  }
  if (data.code === "P2003") {
    return { code: "REGISTRO_VINCULADO", title: "Existe um vínculo com outro registro", message: "Esta operação depende de dados que foram alterados ou ainda estão vinculados a este cadastro.", nextStep: "Atualize a tela e confira os vínculos antes de tentar novamente." };
  }
  if (["P1001", "P1002", "P1017", "P2024", "ETIMEDOUT", "ECONNRESET", "ECONNREFUSED"].includes(String(data.code))) {
    return { code: "SERVICO_INDISPONIVEL", title: "Um serviço está temporariamente indisponível", message: "O sistema não conseguiu se comunicar com o serviço necessário para concluir a operação.", nextStep: "Aguarde um pouco. Antes de tentar novamente, confira se a alteração já aparece no cadastro." };
  }
  if (data.code === "P2022" || data.code === "P2021") {
    return { code: "CONFIGURACAO_DADOS", title: "Precisamos verificar a configuração do sistema", message: "Uma informação necessária não está disponível na estrutura de dados do sistema.", nextStep: "Envie a referência abaixo ao suporte para que possamos corrigir a configuração." };
  }
  if (data.name === "AccessDenied" || data.name === "CredentialsProviderError") {
    return { code: "ACESSO_ARQUIVOS", title: "Não conseguimos acessar o armazenamento de arquivos", message: "O serviço de arquivos não autorizou a operação solicitada.", nextStep: "Envie a referência abaixo ao suporte para verificarmos a configuração de acesso." };
  }
  if (data.name === "TypeError" && /failed to fetch|network|load failed/i.test(String(data.message))) {
    return { code: "FALHA_CONEXAO", title: "Não conseguimos conectar ao sistema", message: "A conexão pode ter sido interrompida ou o serviço pode estar indisponível.", nextStep: "Confira sua conexão. Antes de repetir o envio, veja se a alteração já foi salva." };
  }
  return { code: "FALHA_INESPERADA", title: "Não foi possível concluir esta operação", message: "Ocorreu uma falha que precisa ser verificada pela nossa equipe.", nextStep: "Confira se a alteração já aparece no cadastro. Se o problema continuar, envie a referência abaixo ao suporte." };
}

export function formatFriendlyError(error: FriendlyError) {
  return `${error.message} ${error.nextStep} [${error.code}${error.reference ? ` · ${error.reference}` : ""}]`;
}

export function formatApiError(payload: { error?: string; errorCode?: string; reference?: string } | null, fallback: string) {
  return `${payload?.error || fallback}${payload?.reference ? ` [${payload.errorCode ?? "FALHA_REQUISICAO"} · ${payload.reference}]` : ""}`;
}
