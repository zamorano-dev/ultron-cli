import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

// Helpers
function isSymlink(filePath: string): boolean {
  try {
    return fs.lstatSync(filePath).isSymbolicLink();
  } catch {
    return false;
  }
}

function exists(filePath: string): boolean {
  try {
    fs.lstatSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function removePath(filePath: string) {
  try {
    const stat = fs.lstatSync(filePath);
    if (stat.isSymbolicLink() || stat.isFile()) {
      fs.unlinkSync(filePath);
    } else if (stat.isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    }
  } catch {
    // Path does not exist, ignore
  }
}

function printUsage() {
  console.error("Uso: ultron [PERFIL] [OPÇÕES]");
  console.error("Isola o ambiente do Codex permitindo uso simultâneo em abas diferentes,");
  console.error("compartilhando configurações mas isolando os tokens de login.\n");
  console.error("Opções:");
  console.error("  -o, --open   Abre o Codex logo após a troca.");
  console.error("  -h, --help   Exibe esta ajuda.");
}

function selectMenu(title: string, options: string[]): Promise<number | null> {
  return new Promise((resolve) => {
    let currentIndex = 0;
    const stdin = process.stdin;
    const stdout = process.stderr; // TUI outputs to stderr

    // Hide cursor
    stdout.write('\x1B[?25l');

    let firstRender = true;

    function render() {
      if (!firstRender) {
        // Move cursor up by options.length + 1 lines
        stdout.write(`\x1B[${options.length + 1}A`);
      }
      firstRender = false;

      // Print title
      stdout.write(`\r\x1b[K\x1b[35m? \x1b[1;37m${title}\x1b[0m\n`);
      
      // Print options
      for (let i = 0; i < options.length; i++) {
        stdout.write('\r\x1b[K');
        if (i === currentIndex) {
          stdout.write(`  \x1b[36m❯\x1b[0m \x1b[36m${options[i]}\x1b[0m\n`);
        } else {
          stdout.write(`    ${options[i]}\n`);
        }
      }
    }

    render();

    readline.emitKeypressEvents(stdin);
    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }
    stdin.resume();

    function onKeypress(str: any, key: any) {
      if (key.ctrl && key.name === 'c') {
        cleanup();
        stdout.write('\n');
        resolve(null);
      } else if (key.name === 'up' || key.name === 'k') {
        currentIndex = (currentIndex - 1 + options.length) % options.length;
        render();
      } else if (key.name === 'down' || key.name === 'j') {
        currentIndex = (currentIndex + 1) % options.length;
        render();
      } else if (key.name === 'return' || key.name === 'enter') {
        cleanup();
        // Clear options from terminal
        stdout.write(`\x1B[${options.length}A`);
        for (let i = 0; i < options.length; i++) {
          stdout.write('\r\x1b[K\n');
        }
        stdout.write(`\x1B[${options.length}A`);
        // Print chosen option inline next to the question
        stdout.write(`\x1B[1A\r\x1b[K\x1b[32m✔\x1b[0m \x1b[1;37m${title}\x1b[0m \x1b[90m›\x1b[0m \x1b[36m${options[currentIndex]}\x1b[0m\n\n`);
        resolve(currentIndex);
      }
    }

    function cleanup() {
      stdin.removeListener('keypress', onKeypress);
      if (stdin.isTTY) {
        stdin.setRawMode(false);
      }
      stdin.pause();
      // Show cursor
      stdout.write('\x1B[?25h');
    }

    stdin.on('keypress', onKeypress);
  });
}

function textPrompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr // Output prompt to stderr
    });
    rl.question(`\r\x1b[K\x1b[35m? \x1b[1;37m${question}\x1b[0m `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  let profile = "";
  let openCodex = false;

  for (const arg of args) {
    if (arg === "-h" || arg === "--help") {
      printUsage();
      process.exit(0);
    } else if (arg === "-o" || arg === "--open") {
      openCodex = true;
    } else {
      profile = arg;
    }
  }

  const realHome = process.env.REAL_HOME || process.env.HOME || "";
  if (!realHome) {
    console.error("Erro: Não foi possível determinar o diretório HOME.");
    process.exit(1);
  }

  // Interactive Switcher if no profile argument is provided
  if (!profile) {
    let profiles: string[] = [];
    try {
      const files = fs.readdirSync(realHome);
      for (const file of files) {
        if (file.startsWith('.codex_') && fs.statSync(path.join(realHome, file)).isDirectory()) {
          const name = file.replace('.codex_', '');
          if (name && name !== 'global') {
            profiles.push(name);
          }
        }
      }
    } catch {
      // Ignore reading errors
    }

    if (profiles.length === 0) {
      profiles = ["aspen", "zamoranodev", "pessoal"];
    }

    const options = [...profiles, "+ Criar novo perfil...", "reset (padrão)"];
    
    const selectedIndex = await selectMenu("Selecione o perfil do Codex", options);
    if (selectedIndex === null) {
      process.exit(1);
    }
    
    const choice = options[selectedIndex];
    if (choice === "reset (padrão)") {
      profile = "reset";
    } else if (choice === "+ Criar novo perfil...") {
      const name = await textPrompt("Nome do novo perfil:");
      if (!name) {
        console.error("Erro: Nome do perfil não pode ser vazio.");
        process.exit(1);
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        console.error("Erro: Nome do perfil deve conter apenas letras, números, hífen ou underline.");
        process.exit(1);
      }
      profile = name;
    } else {
      profile = choice;
    }
  }

  // Handle environment cleanup
  if (profile === "reset") {
    console.log("unset ULTRON_CODEX_HOME");
    console.error("🔄 Perfil limpo (usando o padrão).");
    process.exit(0);
  }

  const targetDir = path.join(realHome, `.codex_${profile}`);

  // Prevent circular references/conflicts from previous symbolic link setups
  for (const subDir of [".codex", ".claude"]) {
    const targetSubDir = path.join(targetDir, subDir);
    if (isSymlink(targetSubDir)) {
      fs.unlinkSync(targetSubDir);
    }
    fs.mkdirSync(targetSubDir, { recursive: true });
  }

  // 1. Core Codex configuration files/folders to share
  const codexItems = [
    "config.toml",
    "mcp",
    "plugins",
    "rules",
    "scripts",
    "skills",
    "prompts",
    "AGENTS.md",
    "RTK.md",
    "chrome-native-hosts.json",
    "chrome-native-hosts-v2.json"
  ];

  for (const item of codexItems) {
    const realPath = path.join(realHome, ".codex", item);
    if (exists(realPath)) {
      const targetPath = path.join(targetDir, ".codex", item);
      if (exists(targetPath) && !isSymlink(targetPath)) {
        removePath(targetPath);
      }
      if (!exists(targetPath)) {
        fs.symlinkSync(realPath, targetPath);
      }
    }
  }

  // 2. Claude configs (settings and hooks)
  const claudeItems = ["settings.json", "hooks"];
  for (const item of claudeItems) {
    const realPath = path.join(realHome, ".claude", item);
    if (exists(realPath)) {
      const targetPath = path.join(targetDir, ".claude", item);
      if (exists(targetPath) && !isSymlink(targetPath)) {
        removePath(targetPath);
      }
      if (!exists(targetPath)) {
        fs.symlinkSync(realPath, targetPath);
      }
    }
  }

  // 3. Keep essential developer environment settings & project directories working
  const devEnvItems = [
    ".ssh",
    ".gitconfig",
    ".npmrc",
    ".nvm",
    ".bun",
    ".local",
    ".cache",
    ".zshrc",
    ".bash_profile",
    ".bashrc",
    "projects",
    "Obsidian",
    "Documents",
    "WebstormProjects",
    "Desktop",
    "Downloads"
  ];

  for (const item of devEnvItems) {
    const realPath = path.join(realHome, item);
    const targetPath = path.join(targetDir, item);
    if (exists(realPath) && !exists(targetPath)) {
      fs.symlinkSync(realPath, targetPath);
    }
  }

  // Output environment configuration to stdout for the shell eval
  console.log(`export ULTRON_CODEX_HOME="${targetDir}"`);
  console.error(`✅ Ambiente '${profile}' configurado para uso simultâneo e isolado!`);
}

main().catch((err) => {
  console.error("Erro inesperado:", err);
  process.exit(1);
});
