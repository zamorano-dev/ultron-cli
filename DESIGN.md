---
name: Ultron CLI
description: Powerful cyberpunk-styled terminal profile manager for OpenAI Codex
colors:
  primary: "#00ff66" # Neon Green (Active Profile, Success, Confirmation)
  secondary: "#00ffff" # Cyan (Profile Names, Parameter values)
  accent: "#ff007f" # Neon Pink (Alerts, Errors, Warnings)
  neutral: "#a6adc8" # Soft Silver (Description, Helper text)
  neutral-bg: "#1e1e2e" # Deep Obsidian (Default terminal background)
typography:
  display:
    fontFamily: "JetBrains Mono, Fira Code, Monospace"
    fontSize: "Large"
    fontWeight: "Bold"
  body:
    fontFamily: "Monospace"
    fontSize: "Medium"
    fontWeight: "Normal"
---

# Design System: Ultron CLI

## 1. Overview

**Creative North Star: "The Cybernetic Codex Grid"**

Ultron CLI is designed to evoke the feeling of a futuristic, high-performance hacking terminal. It rejects the generic grey/white plain text of traditional UNIX tools in favor of a vibrant, cyberpunk-styled dashboard that feels alive and highly engineered, while maintaining near-zero shell startup latency. 

The visual layout prioritizes dense, structured tables, futuristic ASCII accents, and micro-animations (e.g., terminal spinners) to indicate progress. However, this visual richness is bounded by strict POSIX principles—ensuring that design never breaks automated piping, scripting, or TTY-less environments.

**Key Characteristics:**
- **Vibrant Cyberpunk Contrast:** Neon green, cyan, and pink highlight key interface states.
- **Micro-Animated Transitions:** Smooth, high-performance loading spinners for asynchronous symlink operations.
- **Strict POSIX Segregation:** Pure shell commands output to `stdout`; all design aesthetics and statuses reside in `stderr`.

## 2. Colors

Terminal colors are defined using high-contrast ANSI escapes that respect the user's terminal theme colors rather than forcing rigid, unreadable RGB overrides in low-color environments.

### Primary
- **Neon Green (ANSI 32 / #00ff66):** Represents active/reset states, successful profile setup, and positive operations. Used selectively to highlight command completion.

### Secondary
- **Cyan (ANSI 36 / #00ffff):** Represents metadata values, profile names, paths, and symlink targets. Helps differentiate key parameters from static label text.

### Accent
- **Neon Pink (ANSI 35 / #ff007f):** Used for error messages, critical warnings, and operations requiring user attention (like profile conflicts).

### Neutral
- **Soft Silver (ANSI 37 / #a6adc8):** Used for standard instruction text, helper lines, and secondary borders.

### Named Rules
**The 10% Color Accent Rule.** Neon colors (Green/Cyan/Pink) must never occupy more than 10% of the terminal line space. The majority of the text should remain in soft silver or default terminal colors to prevent visual fatigue.

## 3. Typography

All typography is strictly monospace, assuming a modern developer font stack (such as JetBrains Mono, Fira Code, or SF Mono).

**Display Font:** JetBrains Mono
**Body Font:** Monospace fallbacks

### Hierarchy
- **Display (Bold ASCII):** Large-format ASCII branding header. Used exclusively when executing help `ultron --help` or during the installation greeting.
- **Headline (Bold, Underlined):** Used to denote table headers or distinct CLI sections (e.g., `OPÇÕES:`, `MASTERS:`).
- **Body (Regular, Monospace):** Standard instructional and help text.
- **Label (Cyan Monospace):** Parameters, active profile names, and option flags.

## 4. Elevation

In a terminal CLI, depth and elevation are expressed using text-based borders, indentations, and vertical grids.

- **Grid Borders:** Standard ASCII characters (`|`, `-`, `+`) or Unicode Box Drawing characters (`│`, `─`, `┌`, `┐`, `└`, `┘`) are used to create structural tables that group information.
- **No-Shadow Flat Design:** All CLI panels are flat, relying entirely on color contrast and borders to indicate groupings.

### Named Rules
**The Box-drawing Border Rule.** Use single-line Unicode box-drawing characters (`┌───┐`) for structural tables, and avoid mixing ASCII (`-`, `+`) and Unicode borders on the same screen.

## 5. Components

CLI visual components are text-based patterns printed to the terminal console.

### Profile Status Indicator
- **Active State:** Prepended with a green checkmark `✅` or a bold green custom status tag `[ACTIVE]`.
- **Inactive State:** Displayed in soft silver with a muted dot `•`.

### Spinners
- **Style:** High-frame-rate Unicode spinner (`⠋`, `⠙`, `⠹`, `⠸`, `⠼`, `⠴`, `⠦`, `⠧`, `⠇`, `⠏`) in Cyan.
- **Behavior:** Active only during active file mutations or network checks. Instantly terminates or switches to a success checkmark upon completion.

### Tables & Grids
- **Header:** Uppercase bold labels with a bottom divider line.
- **Row Alternation:** Standard terminal colors. Selected row values highlighted in Cyan.

## 6. Do's and Don'ts

### Do:
- **Do** route all styled text, spinners, emojis, and status messages to `stderr` (`console.error`).
- **Do** route raw variables, exports, and command strings directly to `stdout` (`console.log`) for shell eval parsing.
- **Do** strip ANSI escape codes automatically when running in non-TTY environments (`!process.stdout.isTTY`).
- **Do** output clean, standard ANSI color codes that adapt naturally to light and dark terminal themes.

### Don't:
- **Don't** output any human-readable status, emoji, or styling to `stdout`, as it will break shell integration wrapper `eval "$(ultron ...)"`.
- **Don't** block interactive terminal loops inside processes that are run within shell command substitution.
- **Don't** use slow loading scripts or dependencies that raise CLI execution time above 50ms.
- **Don't** use hardcoded background colors that could clash with the user's terminal background theme.
