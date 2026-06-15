# Empório Sobreiro - Loja Virtual de Cestas de Presentes

Este é um projeto de uma loja virtual para venda de cestas de presentes, estruturado com um backend em **Node.js** (utilizando **Express** e **Sequelize**) e um banco de dados **PostgreSQL**, com o frontend composto de páginas estáticas em HTML, CSS e JavaScript.

---

## 📋 Pré-requisitos

Para rodar este projeto localmente, você precisará ter instalado:
1. **Node.js** (versão 16 ou superior)
2. **PostgreSQL** instalado e ativo no seu sistema

---

## ⚙️ Passo a Passo para Configuração

### 1. Acessar a Pasta do Projeto
Navegue até a pasta raiz onde o projeto foi clonado utilizando seu terminal preferido (CMD ou PowerShell):
```bash
cd emporio-sobreiro
```

### 2. Instalar Dependências do Node.js
Execute o comando abaixo para baixar todas as bibliotecas necessárias:
```bash
npm install
```
> [!TIP]
> **Dica para usuários de Windows (PowerShell):**
> Se você receber um erro informando que *"a execução de scripts foi desabilitada neste sistema"*, contorne usando:
> ```powershell
> npm.cmd install
> ```
> Ou libere a execução temporariamente na sessão do PowerShell com:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> ```

---

## 🗄️ Configuração do Banco de Dados (PostgreSQL)

O Sequelize está configurado no arquivo `app.js` para se conectar ao banco de dados com as seguintes credenciais padrão:
- **Banco de Dados (Database):** `banco`
- **Usuário:** `postgres`
- **Senha:** `postgres`
- **Host:** `localhost`
- **Porta:** `5432`

> [!IMPORTANT]
> Caso a senha ou usuário do seu PostgreSQL local sejam diferentes, você deve abrir o arquivo `app.js` (nas linhas 45-50) e ajustar as credenciais no construtor do Sequelize.

### Como criar e carregar as tabelas:
1. Abra seu cliente do PostgreSQL (como o **pgAdmin**).
2. Crie um banco de dados vazio chamado **`banco`**:
   ```sql
   CREATE DATABASE banco;
   ```
3. Abra a ferramenta **Query Tool** no banco de dados `banco` recém-criado.
4. Abra ou copie todo o conteúdo do arquivo `banco.sql` (localizado na raiz do projeto).
5. Cole na janela do **Query Tool** e execute (pressionando **F5** ou clicando no botão de Executar).
   - *Nota: O arquivo `banco.sql` já possui a estrutura das tabelas `produtos`, `pedidos` e a tabela `clientes` (que foi adicionada para compatibilidade total), além dos produtos padrão pré-cadastrados.*

---

## 🚀 Inicialização da Aplicação

Depois que as dependências estiverem instaladas e o banco de dados configurado, você pode rodar a aplicação:

No terminal na raiz do projeto, execute:
```bash
node app.js
```

Você deverá ver as seguintes mensagens no terminal confirmando o sucesso:
```text
Banco de dados conectado.
Servidor rodando em http://localhost:3005
```

---

## 🌐 Endpoints e Acesso

Com o servidor rodando, você pode acessar as seguintes URLs no seu navegador:

- **Área do Cliente (Loja):** [http://localhost:3005](http://localhost:3005)
- **Área Administrativa (Produtos):**
  - Cadastrar novo produto: [http://localhost:3005/produtos/cadastrar](http://localhost:3005/produtos/cadastrar)
  - Listar todos os produtos: [http://localhost:3005/produtos/listar-todos](http://localhost:3005/produtos/listar-todos)
- **Área Administrativa (Pedidos):**
  - Listar todos os pedidos realizados: [http://localhost:3005/pedidos/listar-todos](http://localhost:3005/pedidos/listar-todos)
