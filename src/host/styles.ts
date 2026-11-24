export const hostStyles = `
.buzzwort-host {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: clamp(14px, 2.6vh, 28px);
  overflow: auto;
  padding: clamp(18px, 4.3vh, 48px) clamp(24px, 5vw, 90px);
  color: var(--ink);
  font-family: var(--font-body);
  background:
    radial-gradient(ellipse at 90% 0%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 60%),
    var(--paper);
}
.buzzwort-host :is(h1, h2, p, ul, ol) { margin: 0; }
.buzzwort-host :is(ul, ol) { list-style: none; padding: 0; }
.bw-header, .bw-section-header { display: flex; align-items: baseline; justify-content: space-between; gap: 12px 20px; flex-wrap: wrap; }
.bw-header { padding-right: clamp(66px, 8vw, 110px); }
.bw-title { font: 700 clamp(18px, 2.1vw, 32px)/1.15 var(--font-display); }
.bw-turn, .bw-clock-label, .bw-count { color: var(--ink-soft); font-size: clamp(13px, 1.3vw, 18px); }
.bw-turn { font: 600 clamp(13px, 1.35vw, 18px)/1.2 var(--font-mono); }
.bw-stage {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(18px, 4vw, 68px);
  min-height: clamp(200px, 36vh, 360px);
  padding: clamp(22px, 4.2vw, 64px);
  border: 1px solid var(--line);
  border-radius: clamp(22px, 3vw, 40px);
  background: color-mix(in srgb, var(--surface-raised) 92%, var(--accent));
  box-shadow: var(--shadow-panel);
}
.bw-stage::before {
  content: "";
  position: absolute;
  inset: 0 0 0 38%;
  z-index: -1;
  background: repeating-linear-gradient(135deg, transparent 0 15px, color-mix(in srgb, var(--accent) 12%, transparent) 15px 16px);
  mask-image: linear-gradient(90deg, transparent, black);
}
.bw-roles { display: grid; gap: clamp(6px, 1.4vh, 14px); min-width: 0; }
.bw-role { color: var(--accent-strong); font-size: clamp(15px, 1.6vw, 23px); font-weight: 800; }
.buzzwort-host h1 {
  font: 700 clamp(44px, 7vw, 112px)/1 var(--font-display);
  letter-spacing: -.04em;
  overflow-wrap: anywhere;
}
.buzzwort-host h2 { font: 700 clamp(19px, 2.05vw, 30px)/1.15 var(--font-display); }
.bw-watcher, .bw-caption {
  color: var(--ink-soft);
  font-size: clamp(15px, 1.55vw, 23px);
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.bw-caption { max-width: 42ch; }
.bw-clock {
  --bw-clock-color: var(--accent);
  width: clamp(118px, min(18vw, 26vh), 230px);
  aspect-ratio: 1;
  display: grid;
  padding: clamp(5px, .65vw, 9px);
  border-radius: 50%;
  box-sizing: border-box;
  background: conic-gradient(var(--bw-clock-color) var(--bw-progress, 0turn), var(--line) 0);
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--bw-clock-color) 14%, transparent);
  transition: box-shadow .2s ease;
}
.buzzwort-host[data-phase="active"] .bw-clock { --bw-clock-color: var(--sage); }
.buzzwort-host[data-phase="active"] .bw-clock[data-urgent="true"] { --bw-clock-color: var(--danger); }
.bw-face {
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  padding: 8px;
  text-align: center;
  background: var(--surface-raised);
}
.bw-digits {
  font: 700 clamp(33px, min(5.1vw, 8vh), 77px)/1 var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -.07em;
}
.bw-clock-label { font-size: clamp(11px, 1.18vw, 16px); }
.bw-details { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: clamp(20px, 5vw, 84px); min-height: 0; }
.bw-details > section { min-width: 0; display: flex; flex-direction: column; gap: clamp(9px, 1.6vh, 18px); }
.bw-activity > .bw-caption { padding-top: 8px; }
.bw-standings-list { overflow: auto; min-height: 0; scrollbar-width: thin; }
.bw-score, .bw-event {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 2px 14px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--line);
  font-size: clamp(15px, 1.55vw, 22px);
  overflow-wrap: anywhere;
}
.bw-score[data-active="true"] { border-radius: 9px 9px 0 0; background: color-mix(in srgb, var(--accent) 13%, transparent); }
.bw-score[data-team="team2"][data-active="true"] { background: color-mix(in srgb, var(--sage) 15%, transparent); }
.bw-value { color: var(--accent-strong); font: 700 1.12em/1.2 var(--font-mono); }
.bw-score[data-team="team2"] .bw-value { color: var(--sage-strong); }
.bw-members, .bw-delta, .bw-event-player { color: var(--ink-soft); font-size: .8em; }
.bw-members { grid-column: 1 / -1; }
.bw-event { grid-template-columns: minmax(90px, .7fr) minmax(0, 1fr) minmax(0, .7fr); }
.bw-event-type { color: var(--ink-soft); font-size: .84em; font-weight: 700; }
.bw-event[data-kind="solved"] .bw-event-type { color: var(--sage-strong); }
.bw-event[data-kind="buzz"] .bw-event-type { color: var(--danger); }
.bw-event:first-child { animation: bw-event-in .22s ease-out both; }
@keyframes bw-event-in { from { opacity: .45; transform: translateY(-4px); } }
.buzzwort-host:is([data-phase="intro"], [data-phase="result"]) { grid-template-rows: auto minmax(0, 1fr); }
.bw-end { align-self: safe center; justify-self: center; width: min(100%, 760px); display: grid; gap: clamp(10px, 2vh, 22px); }
.bw-end h1 { font-size: clamp(42px, 6vw, 84px); }
.bw-result-list { max-height: min(44vh, 420px); overflow: auto; }
.bw-result-list .bw-score { grid-template-columns: minmax(0, 1fr) 4ch 4ch; }
.bw-result-list .bw-score:first-child { background: color-mix(in srgb, var(--accent) 13%, transparent); }
.bw-result-list .bw-score :is(.bw-delta, .bw-value) { text-align: right; }
@media (min-width: 751px) and (max-height: 620px) {
  .bw-stage { min-height: 0; padding-block: 20px; }
  .bw-score, .bw-event { padding-block: 5px; }
}
@media (max-width: 750px) {
  .buzzwort-host { grid-template-rows: auto auto auto; align-content: start; }
  .bw-details { grid-template-columns: 1fr; gap: 22px; }
  .bw-stage { min-height: 0; }
  .bw-standings-list { max-height: 36vh; }
}
@media (max-width: 440px) {
  .buzzwort-host { padding-inline: 14px; }
  .bw-stage { padding: 16px; gap: 12px; }
  .buzzwort-host h1 { font-size: clamp(27px, 8vw, 38px); }
  .bw-clock { width: 92px; }
  .bw-digits { font-size: 25px; }
}
@media (prefers-reduced-motion: reduce) {
  .bw-event:first-child { animation: none; }
  .bw-clock { transition: none; }
}
`;
