// scratch/test-supabase-auth.js
// Testa a conexão e registro no Supabase localmente usando as variáveis do .env.local

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Carrega .env.local manualmente
const envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("Arquivo .env.local não encontrado!");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : "";
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Variáveis NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes no .env.local!");
  process.exit(1);
}

console.log("Conectando ao Supabase URL:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log("Testando requisição ao banco...");
  const { data, error } = await supabase.from("estabelecimentos").select("*").limit(1);
  if (error) {
    console.error("Erro na consulta de banco:", error.message);
  } else {
    console.log("Conexão ao banco bem sucedida! Dados retornados:", data);
  }

  const testEmail = `teste_${Date.now()}@marbr.com.br`;
  const testPassword = "senha_de_teste_123";
  console.log(`Testando cadastro de usuário com email: ${testEmail}...`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword
  });

  if (authError) {
    console.error("Erro no cadastro de autenticação:", authError.message);
  } else {
    console.log("Cadastro simulado com sucesso!", authData.user ? `User ID: ${authData.user.id}` : "Sem dados do usuário");
  }
}

testConnection();
