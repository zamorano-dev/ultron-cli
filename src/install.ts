import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const realHome = os.homedir();
const binDir = path.join(realHome, '.local', 'bin');
const targetBinary = path.join(binDir, 'ultron-cli');
const zshrcPath = path.join(realHome, '.zshrc');

function install() {
  console.log("⚙️ Compilando o Ultron CLI com Bun...");
  
  // 1. Compile the binary
  const buildResult = spawnSync('bun', ['build', '--compile', '--outfile', 'bin/ultron-cli', 'src/index.ts'], {
    stdio: 'inherit'
  });

  if (buildResult.status !== 0) {
    console.error("❌ Falha ao compilar o Ultron CLI.");
    process.exit(1);
  }

  // 2. Ensure target binary directory exists
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  // 3. Copy/move binary to destination
  const compiledBinary = path.join(process.cwd(), 'bin', 'ultron-cli');
  console.log(`🚚 Instalando o binário em ${targetBinary}...`);
  fs.copyFileSync(compiledBinary, targetBinary);
  fs.chmodSync(targetBinary, 0o755);

  // 4. Update .zshrc
  if (fs.existsSync(zshrcPath)) {
    console.log("📝 Atualizando o seu ~/.zshrc...");
    let zshrcContent = fs.readFileSync(zshrcPath, 'utf8');

    const wrapperBlock = `# >>> ultron-cli wrapper >>>
export REAL_HOME="\${REAL_HOME:-\$HOME}"
codex() {
    if [ -n "$ULTRON_CODEX_HOME" ]; then
        HOME="$ULTRON_CODEX_HOME" command codex "$@"
    else
        command codex "$@"
    fi
}
ultron() {
    eval "$(${targetBinary} "$@")"
}
# <<< ultron-cli wrapper <<<`;

    // Detect and remove previous manual block or wrapper block
    if (zshrcContent.includes('# >>> ultron-cli wrapper >>>')) {
      // Replace existing wrapper block
      const regex = /# >>> ultron-cli wrapper >>>[\s\S]*?# <<< ultron-cli wrapper <<</;
      zshrcContent = zshrcContent.replace(regex, wrapperBlock);
    } else {
      // Find manual functions
      const realHomeExportIdx = zshrcContent.indexOf('export REAL_HOME="${REAL_HOME:-$HOME}"');
      if (realHomeExportIdx !== -1) {
        // Remove everything from that comment/export onwards
        let cleanContent = zshrcContent.substring(0, realHomeExportIdx);
        const lastCommentIdx = cleanContent.lastIndexOf('# Armazena o HOME real');
        if (lastCommentIdx !== -1) {
          cleanContent = cleanContent.substring(0, lastCommentIdx);
        }
        zshrcContent = cleanContent.trimEnd() + '\n\n' + wrapperBlock + '\n';
      } else {
        zshrcContent = zshrcContent.trimEnd() + '\n\n' + wrapperBlock + '\n';
      }
    }

    fs.writeFileSync(zshrcPath, zshrcContent, 'utf8');
    console.log("✅ ~/.zshrc atualizado com sucesso!");
    console.log("💡 Execute 'source ~/.zshrc' ou abra um novo terminal para aplicar as alterações.");
  } else {
    console.warn("⚠️ Arquivo ~/.zshrc não encontrado. Por favor, adicione o wrapper manualmente.");
  }
}

install();
