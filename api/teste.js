import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
  try {
    // Puxa a chave de segurança que você guardou no .env ou na Vercel
    const sql = neon(process.env.DATABASE_URL);
    
    // Faz uma consulta super simples no banco de dados
    const result = await sql`SELECT now()`;
    
    // Devolve a resposta de sucesso para a tela
    return response.status(200).json({
      mensagem: "Conexão com o banco Neon foi um sucesso! 🎉",
      data_do_banco: result[0].now
    });
    
  } catch (erro) {
    // Se algo der errado, avisa qual foi o problema
    return response.status(500).json({ 
      erro: "Falha ao conectar no banco de dados.",
      detalhes: erro.message 
    });
  }
}