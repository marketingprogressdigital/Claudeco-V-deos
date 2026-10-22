/** Erro de entrada do usuário: mensagem curta e detalhes por linha, sem stack trace na CLI. */
export class UserError extends Error {
  constructor(message: string, readonly details: string[] = []) {
    super(message);
  }
}
