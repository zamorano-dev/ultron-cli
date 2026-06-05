# Product

## Register

product

## Users
Developers using OpenAI Codex and other terminal-based AI coding assistants who need to run and manage multiple profiles concurrently across separate terminal sessions without authorization collisions or preference leaks.

## Product Purpose
Provide rapid, isolated, and simultaneous terminal environments for Codex using HOME spoofing and selective symlinking. Success is defined by zero profile leakage, seamless terminal wrapper execution, and under-50ms execution speed.

## Brand Personality
Powerful, futuristic, precise. The voice is command-line authoritative, with a cyberpunk/sci-fi terminal style that feels premium and engineered.

## Anti-references
- Verbose, unstyled scripts that pollute terminal output.
- Slow startup utilities that delay shell initialization.
- Interactive terminal prompts that block scripted automation or subshells.
- Fragile, nested symbolic link configurations that pollute or break host environment folders.

## Design Principles
1. **POSIX Segregation**: Output shell-executable commands (like exports/unsets) to `stdout` exclusively, and route all human-facing, stylized terminal feedback, warnings, and progress indicators to `stderr`.
2. **High-Fidelity Terminal Identity**: Render command feedback using cyberpunk-inspired rich typography, high-contrast indicators, and intentional spacing, transforming a basic utility into an immersive tool.
3. **Frictionless Transparency**: Perform profile routing and symlink verification invisibly, ensuring the developer remains focused on coding without debugging their profile configuration.

## Accessibility & Inclusion
- Auto-detect non-interactive shells and non-TTY/CI outputs to automatically strip ANSI colors, animations, and emojis to prevent log pollution.
- Rely on high-contrast ANSI colors that respect the user's terminal theme colors rather than hardcoded RGB values that clash or become unreadable.
