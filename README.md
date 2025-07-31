# Painel de Controle - Regulariza Caminhoneiro

## 🚀 Visão Geral

Painel de controle web para gerenciar códigos de rastreamento e monitorar estatísticas de visitas do site `regularizacaminhoneiro.com`.

## ✨ Funcionalidades

- 🔐 **Autenticação Segura** - Login protegido com sessões
- 📊 **Dashboard Interativo** - Estatísticas em tempo real
- 🏷️ **Gerenciamento de Códigos** - Adicionar/editar pixels e analytics
- 📈 **Contador de Visitas** - Rastreamento automático de visitantes únicos
- 📋 **Exportação de Dados** - Relatórios em CSV
- 🎨 **Interface Moderna** - Design responsivo e intuitivo

## 🛠️ Tecnologias

- **Backend**: Flask (Python), SQLite
- **Frontend**: HTML5, CSS3, JavaScript, Chart.js
- **Segurança**: Werkzeug, bcrypt, CORS

## 🚀 Instalação Rápida

1. **Ativar ambiente virtual**
   ```bash
   cd painel-controle-regcam
   source venv/bin/activate
   ```

2. **Instalar dependências**
   ```bash
   pip install -r requirements.txt
   ```

3. **Iniciar aplicação**
   ```bash
   python src/main.py
   ```

4. **Acessar painel**
   - URL: `http://localhost:5000`
   - Usuário: `admin`
   - Senha: `admin123`

## 📁 Estrutura

```
painel-controle-regcam/
├── src/
│   ├── models/          # Modelos do banco de dados
│   ├── routes/          # Rotas da API
│   ├── static/          # Frontend (HTML, CSS, JS)
│   ├── database/        # Banco SQLite
│   └── main.py          # Aplicação principal
├── venv/                # Ambiente virtual
└── requirements.txt     # Dependências
```

## 🔧 Configuração

### Credenciais Padrão
- **Usuário**: `admin`
- **Senha**: `admin123`

⚠️ **IMPORTANTE**: Altere as credenciais padrão após o primeiro acesso!

### Configuração de Produção

1. Alterar URL no arquivo `src/static/script.js`
2. Configurar HTTPS
3. Restringir acesso por IP (opcional)

## 📖 Como Usar

### 1. Adicionar Código de Rastreamento

1. Acesse "Códigos de Rastreamento"
2. Clique em "Adicionar Código"
3. Preencha:
   - Nome (ex: "Google Analytics")
   - Posição (Head/Body/Footer)
   - Código HTML/JavaScript
4. Salve e ative o código

### 2. Aplicar Códigos ao Site

1. Certifique-se de que os códigos estão ativos
2. Clique em "Aplicar Códigos ao Site"
3. Confirme a operação
4. Backup automático será criado

### 3. Monitorar Visitas

- Dashboard mostra estatísticas em tempo real
- Gráfico de evolução das visitas
- Exportação de dados em CSV

## 🔒 Segurança

- ✅ Autenticação obrigatória
- ✅ Hash de senhas com bcrypt
- ✅ Backup automático antes de modificações
- ✅ Validação de entrada
- ✅ Sessões seguras

## 📊 Recursos do Dashboard

- **Visitas Hoje**: Contador diário
- **Visitantes Únicos**: Identificação por IP+UserAgent
- **Visitas do Mês**: Estatística mensal
- **Códigos Ativos**: Quantidade de códigos em uso
- **Gráfico Temporal**: Evolução das visitas
- **Última Visita**: Informações detalhadas

## 🐛 Solução de Problemas

### Servidor não inicia
```bash
# Verificar se a porta 5000 está livre
netstat -tulpn | grep :5000

# Verificar dependências
pip install -r requirements.txt
```

### Códigos não aplicados
- Verificar permissões de escrita nos arquivos HTML
- Confirmar caminho correto para o site principal
- Verificar logs no console

### Visitas não registradas
- Verificar se o script de rastreamento está no site
- Confirmar URL do painel no script
- Verificar console do navegador (F12)

## 📝 Logs

- **Aplicação**: Console onde o Flask está rodando
- **Frontend**: Console do navegador (F12)
- **Banco**: Arquivo `src/database/app.db`

## 🔄 Backup e Manutenção

### Backup Automático
- Criado antes de aplicar códigos
- Localização: Mesmo diretório dos arquivos originais

### Backup Manual
```bash
# Banco de dados
cp src/database/app.db backup/app_$(date +%Y%m%d).db

# Projeto completo
tar -czf painel_backup_$(date +%Y%m%d).tar.gz painel-controle-regcam/
```

## 📈 Próximas Funcionalidades

- [ ] Relatórios avançados
- [ ] Notificações por email
- [ ] API REST completa
- [ ] Integração com Google Analytics
- [ ] Dashboard mobile

## 🆘 Suporte

Para dúvidas ou problemas:

1. Consulte esta documentação
2. Verifique os logs de erro
3. Entre em contato com o desenvolvedor

## 📄 Licença

Desenvolvido especificamente para Regulariza Caminhoneiro.

---

**Versão**: 1.0.0  
**Desenvolvido em**: Julho 2025  
**Compatibilidade**: Python 3.8+, Navegadores modernos

