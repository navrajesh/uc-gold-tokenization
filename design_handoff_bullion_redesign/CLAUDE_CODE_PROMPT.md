# Claude Code Kickoff Prompt

Paste this into Claude Code (or Claude in your IDE) at the **root of the `uc-gold-tokenization` repo**, with this `design_handoff_bullion_redesign/` folder placed alongside the `frontend/` directory.

---

## The prompt

> I'm redesigning the frontend of this gold tokenizer dApp. A complete hi-fi design package is in `design_handoff_bullion_redesign/` next to the `frontend/` folder.
>
> **Step 1 — Orient yourself.** Read these in order:
> 1. `design_handoff_bullion_redesign/README.md` — full spec
> 2. `design_handoff_bullion_redesign/designs/design.css` — all tokens + component styles
> 3. `design_handoff_bullion_redesign/designs/atoms.jsx` — shared components
> 4. `design_handoff_bullion_redesign/designs/shell.jsx` — sidebar + topbar
> 5. The screen file for whatever phase we're on (see implementation order in README)
>
> Then read the existing `frontend/` to understand:
> - The framework (React/Vite? Next? Vue?), router, state library, styling approach
> - The wallet/web3 plumbing (wagmi? ethers? viem?)
> - Existing contract clients and ABIs
> - Existing UI primitives — reuse them where they exist
>
> **Step 2 — Plan.** Confirm with me:
> - Which phase from the README's "Recommended Implementation Order" we're tackling
> - Where new files will live
> - Which existing files will be modified/replaced
> - Any architectural questions (especially: role-based routing — does the existing repo gate routes by wallet role today? if not, propose how)
>
> **Step 3 — Implement.** When implementing:
> - Port `design.css` tokens into the codebase's styling system (don't just copy the CSS file — adapt to whatever's already in use; if Tailwind, generate a config; if styled-components, generate a theme; if vanilla CSS modules, fine, copy directly)
> - Use the codebase's existing component primitives where they exist (button, input, card)
> - Match the design's spacing, type, and color exactly — every value is in `design.css`
> - Keep the design's interaction patterns (kanban, wizard steps, pre-flight gate, etc.)
> - Keep all on-chain calls / API calls going through the existing client modules — do **not** invent new ones
> - Treat the JSX in `designs/screens-*.jsx` as visual reference; don't copy it verbatim — re-author it idiomatic to the target stack
>
> **Step 4 — Verify.** For each screen, before declaring done:
> - Open the corresponding artboard in `Bullion Gold Tokenizer.html` next to your implementation
> - Confirm spacing, type, color match
> - Confirm interactive states (hover, active, disabled, error) all work
>
> Start with **Phase 1** from the README: design tokens + base styles. Don't move on until they're in and a sample component is rendering with them.

---

## Tips while working with Claude Code

- **One phase per session.** The README's 9-phase plan exists so you don't context-blow Claude Code with 17 screens at once.
- **Start narrow.** "Implement just the Public Proof of Reserve page" is a much better first task than "rebuild the frontend." It's also the most shippable on its own.
- **Show, don't tell.** When Claude Code drifts visually, screenshot the relevant artboard from the prototype and paste it into the chat.
- **Keep the prototype open in a browser tab.** It's the source of truth for visuals.
- **Push back on shortcuts.** If Claude Code suggests skipping the bar glyph for an emoji or replacing Instrument Serif with a system serif, say no — those details carry the brand.
