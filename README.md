# PulseSocketDB Standalone Demo & Real-Time Monitor

Este é um projeto autônomo e independente para testar, demonstrar e monitorar a integração em tempo real com o **PulseSocketDB**.

---

## 🚀 Como Executar

### 1. Instalar as dependências
```bash
npm install
```

### 2. Iniciar o servidor local do painel (Porta 3333)
```bash
npm start
```
Acesse no seu navegador:
- **Painel Principal**: **`http://localhost:3333/realtime.html`**
- **Painel Versão CDN JavaScript**: 👉 **`http://localhost:3333/realtime_cdn.html`**

---

### 3. Rodar o script de teste de inserção dos 100 itens (Dual-Write Sync)
Em outra janela de terminal:
```bash
npm run sync
```
ou passando sua API Key específica:
```bash
node demo_pulsesocket_sync.js pk_dev_sua_chave_aqui
```

---

## 📁 Estrutura do Projeto
- `server.js`: Servidor Express leve na porta `3333` com suporte a arquivos estáticos e rota proxy de desenvolvimento.
- `public/pulsesocketdb.min.js`: Pacote CDN do cliente JS SDK oficial.
- `public/realtime_cdn.html`: Painel Dashboard que usa a sintaxe limpa `<script src=".../pulsesocketdb.min.js"></script>` (`new PulseSocketDB(...)`, `db.collection().get()`, `db.collection().onSnapshot()`).
- `public/realtime.html`: Painel Dashboard com Socket.io direto.
- `demo_pulsesocket_sync.js`: Script de inserção no banco de dados SQLite local com sincronização automática via HTTP REST para o PulseSocketDB (`http://localhost:3001`).
