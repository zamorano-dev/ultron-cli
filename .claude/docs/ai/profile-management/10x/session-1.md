# 10x Analysis: Ultron CLI Profile Management
Session 1 | Date: 2026-06-05

## Current Value
Hoje, o **Ultron** permite que o usuário isole a variável `$HOME` para apontar para diretórios diferentes (`~/.codex_aspen`, `~/.codex_pessoal`, etc.). Isso resolve o problema de concorrência e conflitos de banco de dados do Codex.
* **Problema resolvido**: Login concorrente de múltiplas contas na mesma máquina sem sobrescrever tokens ou causar "lock" em bancos SQLite.
* **Usuário**: Desenvolvedores usando Codex com contas corporativas (ex: Aspen), de desenvolvimento (ex: zamoranodev) e pessoais.
* **Ação principal**: Alternar o perfil via linha de comando (`ultron <perfil> -o`).

## The Question
O que tornaria o Ultron **10x mais valioso** como um produto e utilitário diário para o desenvolvedor?

---

## Massive Opportunities

### 1. Ultron Control Center (TUI Dashboard)
* **What**: Um painel interativo em tela cheia no terminal (TUI) usando uma biblioteca como `clack`, `ink` ou ANSI escapes customizados. Ele exibe em tempo real o status de todos os perfis cadastrados, mostrando qual perfil está ativo, quais daemons estão rodando em background, e quais diretórios estão bloqueados ("locked") por sessões.
* **Why 10x**: Transforma uma ferramenta utilitária e invisível em um "cockpit" de controle. O usuário deixa de adivinhar o estado dos seus perfis em background e passa a ter controle visual completo do seu ecossistema de agentes.
* **Unlocks**: Gestão visual e rápida de processos em background do Codex, facilitando a limpeza de sessões órfãs ou daemons travados.
* **Effort**: High
* **Risk**: Manter a compatibilidade com diferentes emuladores de terminal e gerenciar concorrência de processos ao buscar dados em background.
* **Score**: 🔥

### 2. Smart Load Balancer & Limit Tracker
* **What**: Um agregador inteligente de limites de API e uso. Ele consulta em segundo plano o status de cada conta cadastrada (usando o banco de dados local `logs_2.sqlite` de cada perfil ou invocando de forma isolada `/status` no Codex daemon) e consolida os limites (5-hour limit, weekly limit, credits) em uma tabela unificada.
* **Why 10x**: Elimina a maior dor de quem usa múltiplas contas: o "rate limit anxiety". O Ultron pode sugerir automaticamente a troca de conta quando os limites de uma estiverem no fim (ex: "Aspen com 10% restando, Pessoal com 100%. Trocar para Pessoal? [Y/n]").
* **Unlocks**: Distribuição otimizada de uso e custos entre contas comerciais e privadas, maximizando o tempo de uptime de desenvolvimento diário do usuário.
* **Effort**: High
* **Risk**: Depende de como o Codex expõe ou grava as informações de limites locais (pode exigir parsing de banco de dados ou execução de comandos do daemon).
* **Score**: 🔥

---

## Medium Opportunities

### 1. Visual MCP & Plugin Manager
* **What**: Um painel TUI interativo para inspecionar e alternar os servidores MCP (Model Context Protocol) declarados em `config.toml`. Permite ativar/desativar servidores (como `context7` ou `chrome-devtools`) com um clique (`Space`) e reiniciar daemons para aplicar as mudanças de forma limpa.
* **Why 10x**: Atualmente, MCPs travados ou com falha de handshake (como o erro do `context7` no status) exigem edição manual de arquivos TOML. Um gerenciador visual avisa imediatamente quais MCPs falharam na inicialização e oferece uma ação de reinicialização rápida.
* **Impact**: Reduz o tempo de debug de conexões MCP de minutos para segundos.
* **Effort**: Medium
* **Score**: 🔥

### 2. Multi-Profile Session Viewer & Tailer
* **What**: Permite listar as sessões de chat abertas de todos os perfis e "assinar" (tail) os logs de depuração de qualquer daemon ativo a partir do painel central.
* **Why 10x**: Permite que o usuário monitore em tempo real o que o Codex está executando em outra aba ou em background sem precisar alternar o shell ou abrir arquivos de log isolados.
* **Impact**: Melhor visibilidade do comportamento dos agentes em background.
* **Effort**: Medium
* **Score**: 👍

---

## Small Gems

### 1. Interactive Switcher (Zero-Argument Launcher)
* **What**: Executar apenas `ultron` (sem argumentos) abre um menu interativo de seleção de perfis via setas do teclado.
* **Why powerful**: Economiza digitação e erros de grafia ao alternar de conta. Exibe instantaneamente os perfis disponíveis na máquina.
* **Effort**: Low
* **Score**: 🔥

### 2. Terminal Prompt Decorator (Zsh Integration)
* **What**: Um comando auxiliar (`ultron prompt`) que pode ser incluído no `PROMPT` do zsh para exibir o perfil ativo atual (ex: `[ultron: aspen]`).
* **Why powerful**: Resolve a ansiedade clássica de rodar um comando no perfil errado. Fornece feedback visual contínuo e discreto.
* **Effort**: Low
* **Score**: 👍

---

## Recommended Priority

### Do Now (Quick wins)
1. **Interactive Switcher**: Modificar `src/index.ts` para que, se nenhum perfil for passado, ele renderize um menu interativo (utilizando um pacote nativo simples como `prompts` ou desenhando via ANSI codes).
2. **Terminal Prompt Decorator**: Expor o perfil ativo através de uma variável de ambiente ou comando rápido para que o usuário possa incluir no seu tema do shell.

### Do Next (High leverage)
1. **Visual MCP Manager**: Desenvolver a interface TUI para listagem, ativação e reinicialização de servidores MCP mapeados no `config.toml`.
2. **Smart Limit Tracker**: Implementar a extração periódica de uso das contas lendo de forma segura os arquivos `.sqlite` correspondentes de cada perfil.

### Explore (Strategic bets)
1. **Ultron Control Center (TUI Completa)**: Criar um dashboard unificado em terminal que combine o seletor de perfis, os limites consolidados de uso das contas e o monitor de processos ativos dos daemons.

---

## Questions

### Answered
* **Q**: Como obter os limites de uso de cada conta sem precisar fazer requisições de rede ou burlar o Codex?
* **A**: O próprio Codex grava os logs de uso localmente em arquivos `.sqlite` dentro de cada ambiente isolado. O Ultron CLI pode ler estes bancos SQLite locais em tempo de leitura offline para obter os últimos valores de limite atualizados.

### Blockers
* **Q**: Quais bibliotecas de TUI são leves e compatíveis com a compilação nativa do Bun? (Precisamos testar se bibliotecas pesadas de Node compilam perfeitamente sem quebrar as dependências nativas no binário final).

## Next Steps
- [ ] Pesquisar e selecionar uma biblioteca de interface interativa para terminal compatível com Bun (ex: `@clack/prompts` ou `enquirer`).
- [ ] Implementar o seletor interativo básico para `ultron` (sem argumentos).
- [ ] Apresentar o plano de TUI para o usuário.
