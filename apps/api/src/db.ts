import { Pool } from 'pg';

// Dois timeouts, porque são duas formas diferentes de o banco "não responder":
// - connectionTimeoutMillis: o banco nem aceita a conexão (fora do ar, host errado).
// - query_timeout: a conexão abre, mas a consulta trava (banco sobrecarregado, lock).
// Sem o segundo, o SELECT 1 do /health esperaria para sempre e a rota nunca responderia.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 2000,
  query_timeout: 2000,
});

// Erro em cliente ocioso do pool (ex.: banco derrubou a conexão) emite 'error' no Pool.
// Sem esse listener, o Node trata como exceção não tratada e derruba o processo inteiro —
// exatamente o que a degradação graciosa do /health existe pra evitar.
pool.on('error', (error) => {
  console.error('Erro em cliente ocioso do pool do Postgres:', error);
});

export async function checkDatabase(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
