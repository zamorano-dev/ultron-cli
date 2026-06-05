import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const realHome = os.homedir();
const binDir = path.join(realHome, '.local', 'bin');
const targetBinary = path.join(binDir, 'ultron-cli');
const zshrcPath = path.join(realHome, '.zshrc');

function compileBinary(): void {
  console.log("⚙️ Compiling Ultron CLI with Bun...");
  const buildResult = spawnSync('bun', ['build', '--compile', '--outfile', 'bin/ultron-cli', 'src/index.ts'], {
    stdio: 'inherit'
  });
  if (buildResult.status !== 0) {
    console.error("❌ Failed to compile Ultron CLI.");
    process.exit(1);
  }
  const signResult = spawnSync('codesign', ['--force', '--sign', '-', 'bin/ultron-cli'], {
    stdio: 'inherit'
  });
  if (signResult.status !== 0) {
    console.error("❌ Failed to sign Ultron CLI binary.");
    process.exit(1);
  }
}

function ensureDirectoryExists(directoryPath: string): void {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function installBinary(sourcePath: string, destinationPath: string): void {
  console.log(`🚚 Installing binary to ${destinationPath}...`);
  fs.copyFileSync(sourcePath, destinationPath);
  fs.chmodSync(destinationPath, 0o755);
}

function getZshrcWrapper(targetBinaryPath: string): string {
  return `# >>> ultron-cli wrapper >>>
export REAL_HOME="\${REAL_HOME:-\$HOME}"
codex() {
    if [ -n "$ULTRON_CODEX_HOME" ]; then
        HOME="$ULTRON_CODEX_HOME" command codex "$@"
    else
        command codex "$@"
    fi
}
ultron() {
    local ABRIR=false
    for arg in "$@"; do
        if [ "$arg" = "-o" ] || [ "$arg" = "--open" ]; then
            ABRIR=true
        fi
    done
    eval "$(${targetBinaryPath} "$@")"
    if [ "$ABRIR" = true ] && [ -n "$ULTRON_CODEX_HOME" ]; then
        codex
    fi
}
# <<< ultron-cli wrapper <<<`;
}

function cleanAndAppendZshrc(content: string, wrapper: string): string {
  const exportIdx = content.indexOf('export REAL_HOME="${REAL_HOME:-$HOME}"');
  if (exportIdx === -1) {
    return content.trimEnd() + '\n\n' + wrapper + '\n';
  }
  let cleanContent = content.substring(0, exportIdx);
  const lastCommentIdx = cleanContent.lastIndexOf('# Armazena o HOME real');
  if (lastCommentIdx !== -1) {
    cleanContent = cleanContent.substring(0, lastCommentIdx);
  }
  return cleanContent.trimEnd() + '\n\n' + wrapper + '\n';
}

function updateZshrc(targetBinaryPath: string): void {
  if (!fs.existsSync(zshrcPath)) {
    console.warn("⚠️ ~/.zshrc file not found. Please add the wrapper manually.");
    return;
  }
  console.log("📝 Updating ~/.zshrc...");
  let zshrcContent = fs.readFileSync(zshrcPath, 'utf8');
  const wrapperBlock = getZshrcWrapper(targetBinaryPath);
  if (zshrcContent.includes('# >>> ultron-cli wrapper >>>')) {
    const regex = /# >>> ultron-cli wrapper >>>[\s\S]*?# <<< ultron-cli wrapper <<</;
    zshrcContent = zshrcContent.replace(regex, wrapperBlock);
  } else {
    zshrcContent = cleanAndAppendZshrc(zshrcContent, wrapperBlock);
  }
  fs.writeFileSync(zshrcPath, zshrcContent, 'utf8');
  console.log("✅ ~/.zshrc updated successfully!");
  console.log("💡 Run 'source ~/.zshrc' or open a new terminal to apply changes.");
}

function install(): void {
  compileBinary();
  ensureDirectoryExists(binDir);
  const compiledBinary = path.join(process.cwd(), 'bin', 'ultron-cli');
  installBinary(compiledBinary, targetBinary);
  updateZshrc(targetBinary);
}

install();
