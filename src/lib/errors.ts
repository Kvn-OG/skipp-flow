// Converte erros do Supabase/Postgres em mensagens que fazem sentido para
// quem usa o sistema. Os códigos são do próprio PostgreSQL.

type MaybePgError = { code?: string; message?: string }

export function errorMessage(error: unknown): string {
  if (!error) return 'Erro desconhecido.'
  const { code, message } = error as MaybePgError

  switch (code) {
    case '23503':
      return 'Este registro está vinculado a outros dados (projetos, conteúdos ou tarefas). Arquive-o ou ajuste os vínculos antes.'
    case '23505':
      return 'Já existe um registro com esses dados.'
    case '23514':
      return 'Algum valor não respeita as regras do sistema (por exemplo, data de término antes do início).'
    case '42501':
      return 'Você não tem permissão para fazer isso.'
    case 'PGRST116':
      return 'Registro não encontrado.'
  }

  if (message?.includes('Failed to fetch')) {
    return 'Não foi possível conectar ao servidor. Verifique sua internet.'
  }
  if (message === 'Invalid login credentials') {
    return 'E-mail ou senha incorretos.'
  }
  return message ?? 'Algo deu errado. Tente novamente.'
}
