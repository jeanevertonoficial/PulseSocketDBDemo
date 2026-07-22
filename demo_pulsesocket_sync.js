import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Configurações do PulseSocketDB Local
const PULSESOCKET_URL = process.env.PULSESOCKET_URL || 'http://localhost:3001';
const PULSESOCKET_API_KEY = process.argv[2] || process.env.PULSESOCKET_API_KEY || 'pk_dev_4dbb07976f2f4466b50ca314ca0e9c59';

/**
 * Função de Sincronização Dual-Write (Banco Primário + PulseSocketDB Real-Time)
 */
async function saveContaAndBroadcast(db, contaData) {
  console.log('\n--- [PASSOS DA OPERAÇÃO DE SINCRONIZAÇÃO] ---');
  
  // 1. Salvar no Banco de Dados Primário (Ex: SQLite / MySQL)
  console.log('1. [DB Primário] Salvando registro no banco de dados relacional...');
  const result = await db.run(
    'INSERT INTO contas (descricao, valor, status, data_vencimento) VALUES (?, ?, ?, ?)',
    [contaData.descricao, contaData.valor, contaData.status, contaData.data_vencimento]
  );
  
  const insertedRecord = {
    id: result.lastID,
    ...contaData,
    created_at: new Date().toISOString()
  };
  console.log('   ✅ Registro salvo no DB local com ID:', insertedRecord.id);

  // 2. Disparar sincronização com PulseSocketDB (Real-time Broadcast)
  console.log(`2. [PulseSocketDB] Transmitindo alteração via HTTP REST para ${PULSESOCKET_URL}...`);
  try {
    const response = await axios.post(
      `${PULSESOCKET_URL}/api/db/contas`,
      insertedRecord,
      {
        headers: {
          'x-api-key': PULSESOCKET_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 3000
      }
    );
    console.log('   ✅ PulseSocketDB respondeu com sucesso! (Status:', response.status, ')');
    console.log('   📡 Evento disparado em tempo real para os clientes conectados na sala "contas".');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.warn('   ⚠️  Aviso: O servidor PulseSocketDB não está escutando na porta 3001 (' + PULSESOCKET_URL + ')');
      console.warn('   💡 Dica: Certifique-se de que o projeto PulseSocketDB esteja rodando localmente (npm run dev na porta 3001).');
    } else {
      console.error('   ❌ Resposta do PulseSocketDB:', error.response?.status || error.message, error.response?.data || '');
    }
  }

  return insertedRecord;
}

async function main() {
  console.log('==================================================');
  console.log('🚀 DEMONSTRAÇÃO DE INTEGRAÇÃO COM PULSESOCKETDB 🚀');
  console.log('==================================================');
  console.log('Servidor Target PulseSocketDB:', PULSESOCKET_URL);

  // Inicializar banco de dados SQLite persistido em arquivo local
  const dbPath = path.resolve(process.cwd(), 'demo_database.sqlite');
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS contas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao TEXT NOT NULL,
      valor REAL NOT NULL,
      status TEXT NOT NULL,
      data_vencimento TEXT
    )
  `);

  console.log('📦 Banco de Dados Relacional (SQLite) inicializado em:', dbPath);

  const categorias = [
    'Aluguel do Escritório', 'Assinatura Nuvem / VPS', 'Conta de Luz', 'Internet Fibra',
    'Licença de Software', 'Salário Desenvolvedor', 'Manutenção Servidor', 'Marketing Digital',
    'Supermercado / Suprimentos', 'Consultoria Jurídica', 'Seguro Empresarial', 'Assinatura API AI'
  ];
  const statuses = ['PENDENTE', 'PAGO', 'ATRASADO', 'EM_PROCESSAMENTO'];

  console.log('\n🔄 Inserindo 100 itens no banco de dados e sincronizando com PulseSocketDB...');

  for (let i = 1; i <= 100; i++) {
    const cat = categorias[(i - 1) % categorias.length];
    const valor = parseFloat(((Math.random() * 1500) + 50).toFixed(2));
    const status = statuses[i % statuses.length];
    const dia = String((i % 28) + 1).padStart(2, '0');
    const mes = String(((i % 12) + 1)).padStart(2, '0');
    const data_vencimento = `2026-${mes}-${dia}`;

    await saveContaAndBroadcast(db, {
      descricao: `${cat} #${i}`,
      valor,
      status,
      data_vencimento
    });
  }

  // Exibir total de dados salvos no banco local
  const rows = await db.all('SELECT * FROM contas');
  console.log(`\n📊 Total de Registros no Banco Local (SQL): ${rows.length} itens`);
  console.log('Amostra dos últimos 5 registros inseridos:');
  console.table(rows.slice(-5));

  // Fechar a conexão com o banco SQLite para liberar a trava do arquivo no SO e persistir tudo no disco
  await db.close();

  console.log('\n==================================================');
  console.log('✨ Demonstração concluída e banco salvo com sucesso!');
  console.log('==================================================');
}

main().catch(err => {
  console.error('Erro na execução:', err);
});
