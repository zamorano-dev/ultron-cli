import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

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

function main() {
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

  // Handle environment cleanup
  if (profile === "reset") {
    console.log("unset ULTRON_CODEX_HOME");
    console.error("🔄 Perfil limpo (usando o padrão).");
    process.exit(0);
  }

  if (!profile) {
    console.error("Erro: Informe o perfil (ex: aspen, zamoranodev, pessoal).");
    printUsage();
    process.exit(1);
  }

  const realHome = process.env.REAL_HOME || process.env.HOME || "";
  if (!realHome) {
    console.error("Erro: Não foi possível determinar o diretório HOME.");
    process.exit(1);
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

  if (openCodex) {
    console.error("🚀 Iniciando o Codex...");
    
    // Spawn codex with the new HOME set to targetDir
    const result = spawnSync("codex", [], {
      env: {
        ...process.env,
        HOME: targetDir
      },
      stdio: "inherit"
    });

    if (result.error) {
      console.error(`Erro ao iniciar o Codex: ${result.error.message}`);
      process.exit(1);
    }
  }
}

main();
