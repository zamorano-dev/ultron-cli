# ⚡️ Ultron CLI

> Gerenciador concorrente e inteligente de múltiplos perfis para o OpenAI Codex.

[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![macOS](https://img.shields.io/badge/mac%20os-000000?style=for-the-badge&logo=macos&logoColor=F0F0F0)](https://apple.com)

O **Ultron** é um utilitário de terminal ultra-rápido desenvolvido em **TypeScript** e compilado nativamente com **Bun**. Ele permite o uso de múltiplas identidades (ex: *aspen*, *pessoal*, *work*) no OpenAI Codex de forma **100% simultânea**, compartilhando suas ferramentas, configurações e MCPs globais, mas isolando seus tokens de login, históricos de chat e memórias.

---

## 🏗️ Arquitetura

O funcionamento se baseia em duas técnicas: **HOME Spoofing** (simulação de diretório raiz) e **Selective Symlinking** (criação de atalhos seletivos).

```mermaid
graph TD
    subgraph Host ["Máquina Local (REAL_HOME)"]
        RH_SSH[".ssh/"]
        RH_Git[".gitconfig"]
        RH_Proj["projects/"]
        subgraph RealCodex [".codex/ (Global)"]
            RC_Conf["config.toml (Preferences)"]
            RC_MCP["mcp/ (MCP Servers)"]
            RC_Skills["skills/ (Compozy Skills)"]
            RC_Plugins["plugins/ (Plugins)"]
            RC_Auth["auth.json (Real Login)"]
            RC_DB["logs_2.sqlite (Real History)"]
        end
    end

    subgraph Profile ["Perfil Isolado (~/.codex_aspen)"]
        PH_SSH[".ssh/"] -.-> RH_SSH
        PH_Git[".gitconfig"] -.-> RH_Git
        PH_Proj["projects/"] -.-> RH_Proj
        subgraph IsoCodex [".codex/"]
            PC_Conf["config.toml"] -.-> RC_Conf
            PC_MCP["mcp/"] -.-> RC_MCP
            PC_Skills["skills/"] -.-> RC_Skills
            PC_Plugins["plugins/"] -.-> RC_Plugins
            PC_Auth["auth.json (Aspen Token)"]
            PC_DB["logs_2.sqlite (Aspen History)"]
        end
    end

    classDef shared fill:#1e1e2e,stroke:#cba6f7,stroke-width:2px,color:#cdd6f4;
    classDef isolated fill:#313244,stroke:#f38ba8,stroke-width:2px,color:#cdd6f4;
    classDef real fill:#181825,stroke:#a6e3a1,stroke-width:1px,color:#a6e3a1;

    class RH_SSH,RH_Git,RH_Proj,RC_Conf,RC_MCP,RC_Skills,RC_Plugins real;
    class PH_SSH,PH_Git,PH_Proj,PC_Conf,PC_MCP,PC_Skills,PC_Plugins shared;
    class RC_Auth,RC_DB,PC_Auth,PC_DB isolated;
```

---

## 🛠️ O que é Compartilhado vs. Isolado

| Tipo | Recurso | Estado | Descrição |
| :--- | :--- | :--- | :--- |
| 🔒 **Isolado** | `auth.json` | **Exclusivo** | Token de login e sessão ativa da conta OpenAI. |
| 🔒 **Isolado** | `logs_2.sqlite` | **Exclusivo** | Histórico de todas as conversas do chat. |
| 🔒 **Isolado** | `memories_1.sqlite` | **Exclusivo** | Banco de memórias personalizadas que a IA cria sobre você. |
| 🔒 **Isolado** | `sessions/` | **Exclusivo** | Logs brutos das sessões ativas do terminal. |
| 🤝 **Compartilhado** | `config.toml` | **Vinculado** | Preferências gerais do Codex (Modelo de IA, limites de contexto, tema). |
| 🤝 **Compartilhado** | `mcp/` & `plugins/` | **Vinculado** | Configuração e manifestos dos servidores MCP instalados. |
| 🤝 **Compartilhado** | `.ssh/` & `.gitconfig` | **Vinculado** | Suas chaves SSH e dados do Git para trabalhar sem barreiras nos repositórios. |

---

## 🚀 Instalação Rápida

Certifique-se de ter o [Bun](https://bun.sh) instalado. No diretório do projeto, execute o comando de instalação:

```bash
pnpm install # ou bun install
bun run install
```

O instalador irá automaticamente:
1. Compilar o TypeScript em um binário nativo ultra-rápido (`bin/ultron-cli`).
2. Mover o binário para `~/.local/bin/ultron-cli`.
3. Inserir os ganchos do wrapper (`ultron` e `codex`) no seu `~/.zshrc`.

Após finalizar, recarregue o terminal:
```bash
source ~/.zshrc
```

---

## 💡 Como Usar

### Alternar Perfil
Configura a variável de ambiente para isolar os logins, mas mantém o terminal ativo.
```bash
ultron aspen
```

### Alternar Perfil e Abrir o Codex
Ativa o perfil correspondente e já inicia a interface de terminal do Codex sob o TTY correto.
```bash
ultron aspen -o
# ou
ultron pessoal --open
```

### Resetar para o Padrão
Limpa a variável do Ultron e volta a utilizar a pasta padrão do Codex (`~/.codex`).
```bash
ultron reset
```

### Exibir Ajuda
```bash
ultron --help
```
