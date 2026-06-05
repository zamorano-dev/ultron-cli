# Agent Instructions: Ultron CLI

Este repositório contém o **Ultron**, um utilitário para gerenciamento concorrente e isolado de múltiplos perfis do Codex através de HOME Spoofing e Selective Symlinking.

## 🛠️ Command Reference

Sempre utilize os seguintes comandos para construir e testar a aplicação:

*   **Executar em Modo de Desenvolvimento:**
    ```bash
    bun run start [perfil] [opções]
    ```
*   **Compilar Executável Nativo:**
    ```bash
    bun run build
    ```
    Gera o binário nativo compilado em `bin/ultron-cli`.
*   **Instalar na Máquina:**
    ```bash
    bun run install
    ```
    Compila o binário, copia-o para `/Users/brunozamorano/.local/bin/ultron-cli` e atualiza a função de inicialização em `~/.zshrc`.

---

## 🏗️ Padrões de Código e Arquitetura

Qualquer agente trabalhando nesta base de código deve respeitar as seguintes diretrizes, além de seguir estritamente o guia de [code-standards.md](file:///Users/brunozamorano/projects/ultron-cli/.rules/code-standards.md):

### 1. Comunicação com o Terminal (Padrão POSIX)
*   **Stdout (`console.log`)**: Reservado **exclusivamente** para comandos avaliáveis pelo shell (ex: `export ULTRON_CODEX_HOME="..."` ou `unset ULTRON_CODEX_HOME`). Qualquer outro texto aqui quebrará a integração com o shell.
*   **Stderr (`console.error`)**: Usado para mensagens de status amigáveis, ajuda, logs de progresso e erros.

### 2. Evitar Invocação do Codex Dentro do Binário (TTY Preservation)
*   **Regra de Ouro**: O binário compilado **nunca** deve invocar o `codex` de forma síncrona ou assíncrona.
*   **Motivo**: A execução ocorre dentro de uma substituição de comando `eval "$(ultron-cli ...)"`, o que desvia o `stdout` para um pipe, quebrando o suporte a terminal interativo (TTY).
*   **Solução**: O lançamento do Codex é gerenciado exclusivamente pelo shell wrapper em `~/.zshrc` caso a flag `-o`/`--open` esteja ativa.

### 3. Mapeamento de Compartilhamento (Symlinking)
Ao criar novos perfis, siga rigorosamente a separação de recursos:
*   **Configurações Globais Compartilhadas** (Via symlinks para `~/.codex/`): `config.toml`, `mcp`, `plugins`, `rules`, `scripts`, `skills`, `prompts`.
*   **Dados e Logins Isolados** (Salvos localmente no perfil): `auth.json`, `sessions/`, `logs_2.sqlite`, `memories_1.sqlite`, `goals_1.sqlite`, `state_5.sqlite`.
*   **Ambiente Host** (Via symlinks para `~/`): `.ssh`, `.gitconfig`, `.npmrc`, `.nvm`, `.bun`, `projects`.

---

## 📂 Estrutura de Arquivos Importante
*   [code-standards.md](file:///Users/brunozamorano/projects/ultron-cli/.rules/code-standards.md): Diretrizes e padrões de desenvolvimento da base de código.
*   [src/index.ts](file:///Users/brunozamorano/projects/ultron-cli/src/index.ts): Código principal da CLI (parsing e lógica de symlink).
*   [src/install.ts](file:///Users/brunozamorano/projects/ultron-cli/src/install.ts): Script de compilação e integração com a shell configuration do usuário.
*   [tsconfig.json](file:///Users/brunozamorano/projects/ultron-cli/tsconfig.json): Definições do compilador Bun.
