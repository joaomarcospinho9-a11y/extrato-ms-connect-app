import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // 1. Verifica se a requisição está enviando dados (POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido. Use POST.' });
  }

  // 2. Pega o email e a senha que o site vai enviar
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
  }

  try {
    // 3. Conecta no banco de dados Neon
    const sql = neon(process.env.DATABASE_URL);
    
    // 4. Procura na tabela de usuários alguém com esse email e senha
    // (Lembrete: num sistema real, a senha não ficaria solta assim, usaríamos criptografia!)
    const usuarios = await sql`SELECT * FROM usuarios WHERE email = ${email} AND senha = ${senha}`;

    // 5. Se encontrou alguém, o login deu certo!
    if (usuarios.length > 0) {
      return res.status(200).json({ 
        sucesso: true, 
        mensagem: 'Login realizado com sucesso! 🎉', 
        usuario: usuarios[0].nome 
      });
    } else {
      // Se não encontrou, os dados estão errados
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

  } catch (error) {
    return res.status(500).json({ erro: 'Erro interno no servidor', detalhes: error.message });
  }
}
