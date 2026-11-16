'use strict';

// Original, deterministic SVGs. Colours inherit the Scientific colour scheme.
// No measurements or laboratory performance results are represented here.
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
// Mathematical symbols are styled individually: operators and descriptive
// indices stay upright, scalars are italic, vectors and matrices are bold.
function math(value, bold = '') {
  const atoms = (text, index = false) => [...text.matchAll(/diag|exp|GF|[A-Za-zΑ-ωŝ]|[^A-Za-zΑ-ωŝ]+/gu)].map(([token]) => {
    const variable = /^[A-Za-zΑ-ωŝ]$/u.test(token) && !['j', 'e'].includes(token);
    const upright = !variable || (index && !'ijknKN'.includes(token));
    return `<tspan class="${upright ? 'sc-upright' : bold.includes(token) && !index ? 'sc-vector' : 'sc-scalar'}">${escape(token)}</tspan>`;
  }).join('');
  return { svg: [...value.matchAll(/([_^])(?:\{([^}]+)\}|(.))|([^_^]+)/gu)].map(([, shift, group, single, plain]) =>
    shift ? `<tspan baseline-shift="${shift === '_' ? 'sub' : 'super'}" font-size="65%">${atoms(group || single, true)}</tspan>` : atoms(plain)).join('') };
}
const t = (x, y, value, cls = '', extra = '') => `<text x="${x}" y="${y}" class="sc-label ${cls}" ${extra}>${value && typeof value === 'object' ? value.svg : escape(value)}</text>`;
const line = (x1, y1, x2, y2, cls = 'sc-wire', extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}" ${extra}/>`;
const path = (d, cls = 'sc-wire', extra = '') => `<path d="${d}" class="${cls}" ${extra}/>`;
const rect = (x, y, width, height, cls = 'sc-box', rx = 6, extra = '') => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" class="${cls}" ${extra}/>`;
const circle = (cx, cy, r, cls = 'sc-node', extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" class="${cls}" ${extra}/>`;
const center = (x, y, value, cls = '', extra = '') => t(x, y, value, cls, `text-anchor="middle" ${extra}`);
const tx = (x, y, size = 1) => `<g transform="translate(${x} ${y}) scale(${size})" aria-hidden="true">${path('M0 0 L-24 78 H24 Z M-16 52 H16 M-8 26 H8', 'sc-wire sc-strong')}${line(0, -14, 0, 10, 'sc-wire sc-strong')}${circle(0, -15, 5, 'sc-dot')}${path('M-17 -32 A24 24 0 0 0 -17 2 M17 -32 A24 24 0 0 1 17 2', 'sc-accent-wire')}${path('M-29 -43 A40 40 0 0 0 -29 14 M29 -43 A40 40 0 0 1 29 14', 'sc-wire sc-faint')}</g>`;
const terminal = (x, y, label, size = 1) => `<g transform="translate(${x} ${y}) scale(${size})">${rect(-18, -28, 36, 56, 'sc-device', 6)}${line(-8, 18, 8, 18, 'sc-wire')}${center(0, 56, label, 'sc-small sc-mono')}</g>`;

const labels = {
  access: {
    ru: ['RSMA · общий и приватные потоки', 'Базовая станция с N антеннами передаёт общий поток и K приватных потоков K одноантенным абонентам. Показаны абоненты 1, 2, …, K. Векторы прекодирования p включают распределение мощности. Каждый сначала декодирует общий поток s_c, восстанавливает и вычитает его вклад с помощью SIC, затем декодирует свой приватный поток. Чужой приватный поток остаётся помехой. Общий поток содержит части сообщений пользователей.', 'Одноуровневая RSMA', 'пользователь 1', 'пользователь 2', 'Общий → SIC → свой приватный', 'SIC: восстановить и вычесть вклад s_c', 'Чужой приватный поток остаётся помехой'],
    en: ['RSMA · common and private streams', 'A base station with N antennas transmits one common and K private streams to K single-antenna users. Users 1, 2, …, K are shown. The precoding vectors p include power allocation. Each decodes the common stream s_c first, reconstructs and subtracts its contribution using SIC, then decodes its own private stream. The other private stream is treated as interference. The common stream carries parts of the user messages.', 'One-layer RSMA', 'user 1', 'user 2', 'Common → SIC → own private', 'SIC: reconstruct and subtract s_c', 'Other private streams remain interference']
  },
  mimo: {
    ru: ['MIMO · пространственное прекодирование', 'Два потока подаются в линейный прекодер P и передаются антенной решёткой. Каждый пользователь принимает сумму сигналов через свой вектор канала h_k. Полупрозрачные области обозначают направленную передачу схематически: это не рассчитанные диаграммы направленности, и полное устранение взаимных помех не предполагается.', 'Пространственное прекодирование', 'потоки', 'прекодер', 'решётка', 'Схема пространственных каналов', 'Направления показаны условно; взаимные помехи возможны.'],
    en: ['MIMO · spatial precoding', 'Two streams pass through a linear precoder P and are transmitted by an antenna array. Each user receives the sum through its channel vector h_k. Translucent regions indicate directional transmission conceptually, not computed radiation patterns. Perfect interference cancellation is not assumed.', 'Spatial precoding', 'streams', 'precoder', 'array', 'Spatial channel concept', 'Directions are schematic; inter-user interference may remain.']
  },
  ris: {
    ru: ['RIS · управляемое отражение', 'Падающий сигнал передатчика отражается пассивной решёткой к приёмнику. Источник и приёмник находятся в отражающем полупространстве. Отдельные элементы изменяют фазу отражения. Показана упрощённая узкополосная диагональная модель без усиления; реальные потери и взаимная связь элементов здесь не рассчитаны.', 'Управляемое отражение', 'передатчик', 'приёмник', 'падает', 'отражается', 'φₙ · фаза элемента', 'Пассивная поверхность · без усиления', 'Φ = diag(βₙ exp(jφₙ)),  0 ≤ βₙ ≤ 1'],
    en: ['RIS · controlled reflection', 'A passive array reflects the incident transmitter signal towards a receiver. Both source and receiver are in the reflecting half-space. Individual elements adjust reflection phase. This is a simplified narrowband diagonal model without amplification; losses and mutual coupling are not calculated.', 'Controlled reflection', 'transmitter', 'receiver', 'incident', 'reflected', 'φₙ · element phase', 'Passive surface · no amplification', 'Φ = diag(βₙ exp(jφₙ)),  0 ≤ βₙ ≤ 1']
  },
  polar: {
    ru: ['Полярное преобразование · N = 8', 'Точная сеть трёх ступеней преобразования x = u F в третьей степени Кронекера над GF(2), F = [[1,0],[1,1]], в естественном порядке без перестановки битов. На ступенях соединены пары с расстоянием 1, 2 и 4. Кружок с плюсом означает XOR; пересечения без точки не соединены. Замороженные позиции 0, 1, 2, 4 выбраны для пояснения и не заявлены оптимальными для канала.', 'Полярное преобразование', 'вход u', 'выход x', '0 · замороженная', 'u · информация', '⊕ · сложение по модулю 2', 'x = u F⊗³ · без перестановки битов', 'Набор замороженных позиций — пример, не результат оптимизации.'],
    en: ['Polar transform · N = 8', 'Exact three-stage network for x = u F to the third Kronecker power over GF(2), F = [[1,0],[1,1]], in natural order without bit reversal. Stages couple pairs at distances 1, 2 and 4. Plus circles denote XOR; crossings without dots are not connected. Frozen positions 0, 1, 2 and 4 are illustrative, not claimed optimal for a channel.', 'Polar transform', 'input u', 'output x', '0 · frozen', 'u · information', '⊕ · addition modulo 2', 'x = u F⊗³ · no bit reversal', 'Frozen positions are an example, not an optimized construction.']
  },
  dsp: {
    ru: ['16-QAM · компенсация фазы', 'Синтетическое созвездие 16-QAM до и после идеальной компенсации постоянного поворота фазы на 20 градусов. Точки вычислены из декартова произведения уровней минус три, минус один, один, три. Шум, ошибки оценки и частотное смещение не моделируются. Это поясняющая схема, а не измерения лаборатории.', 'Компенсация фазы · 16-QAM', 'до', 'после', 'поворот на 20°', 'идеальная компенсация', 'Синтетический пример · без шума', 'r = s eʲφ    →    ŝ = r e⁻ʲφ = s'],
    en: ['16-QAM · phase compensation', 'Synthetic 16-QAM constellation before and after ideal compensation of a constant 20-degree phase rotation. Points use the Cartesian product of levels minus three, minus one, one and three. Noise, estimation error and frequency offset are not modelled. This explains a principle and is not laboratory measurement data.', 'Phase compensation · 16-QAM', 'before', 'after', '20° rotation', 'ideal compensation', 'Synthetic example · no noise', 'r = s eʲφ    →    ŝ = r e⁻ʲφ = s']
  },
  hero: {
    ru: ['Система беспроводной связи · MIMO и RIS', 'Концептуальная нисходящая многопользовательская система: передатчик с антенной решёткой, два пользовательских терминала, прямые каналы и дополнительный отражённый путь через пассивную RIS. Тонкие линии показывают связи между узлами, а не рассчитанные траектории или диаграммы направленности. Результаты измерений и количественные выигрыши не показаны.', 'Сигнал. Канал. Связь.', 'Антенная решётка', 'пользователь 1', 'пользователь 2', 'Пассивная RIS', 'Прямой и отражённый пути', 'Концептуальная схема многопользовательской системы'],
    en: ['Wireless system · MIMO and RIS', 'Conceptual multiuser downlink with an antenna-array transmitter, two user terminals, direct channels and an additional reflected path through a passive RIS. Thin lines show node connectivity, not calculated propagation trajectories or radiation patterns. No measurements or quantitative gains are represented.', 'Signal. Channel. Connection.', 'Antenna array', 'user 1', 'user 2', 'Passive RIS', 'Direct and reflected paths', 'Conceptual multiuser communication system']
  }
};

function surface(x, y, columns = 6, rows = 4, cell = 29) {
  let result = '';
  // Affine front view of one planar array. A clock hand denotes phase, not power.
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const px = x + col * cell - row * 9, py = y + row * cell + col * 7;
      const phase = col * Math.PI / 3;
      result += `<g data-sc-phase="${col}" class="sc-phase-cell">${path(`M${px} ${py} l${cell - 5} 6 l-7 ${cell - 5} l-${cell - 5} -6 Z`, 'sc-tile')}${line(px + 9, py + 14, +(px + 9 + 7 * Math.cos(phase)).toFixed(2), +(py + 14 - 7 * Math.sin(phase)).toFixed(2), 'sc-accent-wire')}${circle(px + 9, py + 14, 1.8, 'sc-dot')}</g>`;
    }
  }
  return result;
}

function access(l, expanded, arrow) {
  const ru = l === labels.access.ru;
  let result = '';
  // Effective precoders p include the power weights of the source model.
  for (const [index, y] of [['c', 84], ['1', 164], ['2', 244], ['K', 344]]) {
    const common = index === 'c';
    result += `<g data-sc-flow="${common ? 'common' : 'private'}">${rect(34, y - 25, 130, 50, common ? 'sc-box sc-common' : 'sc-box')}${center(99, y + 8, math(`p_${index} s_${index}`, 'p'), 'sc-math')}${path(`M164 ${y} H190 V214 H202`, common ? 'sc-accent-wire' : 'sc-wire')}</g>`;
  }
  result += center(99, 303, '⋮', 'sc-math');
  result += circle(224, 214, 22, 'sc-sum') + center(224, 222, '+', 'sc-equation');
  result += line(246, 214, 286, 214, 'sc-accent-wire', arrow) + center(267, 189, math('x', 'x'), 'sc-math');
  result += rect(296, 112, 46, 204, 'sc-array');
  for (let i = 0; i < 6; i++) result += circle(319, 131 + i * 33, 6, 'sc-dot');
  result += center(319, 355, math('N'), 'sc-math') + center(319, 380, ru ? 'антенн' : 'antennas', 'sc-small');
  for (const [index, y] of [['1', 94], ['2', 204], ['K', 334]]) {
    result += line(350, 214, 457, y, 'sc-wire', arrow);
    result += t(y === 204 ? 391 : 375, y === 204 ? 191 : y === 94 ? 124 : 335, math(`h_${index}^H`, 'h'), 'sc-math');
    result += terminal(480, y, '', .65);
    result += t(511, y - 40, { svg: escape(ru ? 'Абонент ' : 'User ') + math(index).svg }, 'sc-small');
    result += line(493, y, 505, y, 'sc-wire', arrow);
    result += `<g data-sc-flow="common">${rect(512, y - 24, 54, 48, 'sc-box sc-common')}${center(539, y + 8, math('s_c'), 'sc-math')}${line(567, y, 581, y, 'sc-accent-wire', arrow)}</g>`;
    result += rect(588, y - 24, 54, 48) + center(615, y + 6, 'SIC', 'sc-small sc-upright');
    result += line(644, y, 658, y, 'sc-wire', arrow);
    result += `<g data-sc-flow="private">${rect(665, y - 24, 54, 48)}${center(692, y + 8, math(`s_${index}`), 'sc-math')}</g>`;
  }
  result += center(615, 270, '⋮', 'sc-math');
  result += line(34, 405, 726, 405, 'sc-rule');
  result += t(34, 448, math('x = p_c s_c + ∑_{k=1}^K p_k s_k', 'xp'), 'sc-math');
  result += t(471, 448, math('y_k = h_k^H x + n_k', 'hx'), 'sc-math');
  return result;
}

function mimo(l, expanded, arrow) {
  let result = '';
  result += rect(45, 139, 70, 58) + center(80, 177, math('s_1'), 'sc-math') + rect(45, 249, 70, 58) + center(80, 287, math('s_2'), 'sc-math');
  result += path('M115 168 H152 V198 H183 M115 278 H152 V248 H183', 'sc-wire', arrow);
  result += rect(191, 144, 92, 158, 'sc-box sc-common') + center(237, 236, math('P', 'P'), 'sc-equation');
  result += t(44, 351, l[3], 'sc-small') + center(237, 351, l[4], 'sc-small');
  result += line(283, 223, 328, 223, 'sc-accent-wire', arrow) + rect(337, 104, 52, 238, 'sc-array');
  for (let i = 0; i < 8; i++) result += circle(363, 123 + i * 28, 7, 'sc-dot');
  result += center(363, 374, l[5], 'sc-small');
  result += path('M395 186 Q484 80 620 77 Q577 150 395 220 Z', 'sc-beam');
  result += path('M395 236 Q578 280 646 352 Q516 342 395 268 Z', 'sc-beam sc-beam-secondary');
  result += path('M400 201 L632 109', 'sc-accent-wire', arrow) + path('M400 253 L645 325', 'sc-accent-wire', arrow);
  result += t(504, 151, math('h_1^H', 'h'), 'sc-math') + t(526, 289, math('h_2^H', 'h'), 'sc-math');
  result += terminal(665, 103, 'UE₁') + terminal(678, 323, 'UE₂');
  result += line(44, 397, 716, 397, 'sc-rule') + t(44, 432, math('x = Ps', 'xPs'), 'sc-math') + t(284, 432, math('y_k = h_k^H x + n_k', 'hx'), 'sc-math');
  if (expanded) result += t(44, 455, l[7], 'sc-tiny');
  return result;
}

function ris(l, expanded, arrow) {
  let result = '' + surface(330, 74, 6, 4, 29);
  result += tx(112, 280, .8) + terminal(652, 308, '', 1.1);
  result += path('M143 263 L309 193', 'sc-accent-wire', arrow) + path('M439 227 L618 291', 'sc-accent-wire', arrow);
  result += path('M162 291 L308 221 M463 212 L609 266', 'sc-wire sc-faint');
  result += t(171, 224, l[5], 'sc-small') + t(491, 229, l[6], 'sc-small');
  result += center(112, 378, l[3], 'sc-small') + center(651, 378, l[4], 'sc-small');
  result += line(373, 250, 373, 347, 'sc-wire sc-dashed', arrow) + t(386, 326, math('n', 'n'), 'sc-small sc-math');
  result += line(534, 147, 568, 126, 'sc-wire') + t(559, 110, math('φ_n'), 'sc-math');
  result += line(44, 397, 716, 397, 'sc-rule') + t(44, 432, expanded ? math('Φ = diag(β_n exp(jφ_n)),  0 ≤ β_n ≤ 1', 'Φ') : l[8], expanded ? 'sc-math' : 'sc-small');
  if (expanded) result += t(44, 455, l[8], 'sc-tiny');
  return result;
}

function polar(l, expanded) {
  const frozen = new Set([0, 1, 2, 4]), ys = Array.from({ length: 8 }, (_, i) => 98 + 36 * i);
  let result = '' + t(57, 76, math('u', 'u'), 'sc-small sc-math') + t(645, 76, math('x', 'x'), 'sc-small sc-math');
  for (let i = 0; i < 8; i++) {
    result += rect(48, ys[i] - 14, 37, 28, frozen.has(i) ? 'sc-frozen' : 'sc-info', 3);
    result += center(66.5, ys[i] + 7, frozen.has(i) ? '0' : math('u'), 'sc-small sc-math');
    result += t(100, ys[i] + 7, math(`u_${i}`), 'sc-small sc-math');
    result += line(139, ys[i], 652, ys[i], 'sc-wire');
    result += t(668, ys[i] + 7, math(`x_${i}`), 'sc-small sc-math');
  }
  // In-place butterfly: v[i] ^= v[i + stride], i & stride == 0.
  // Applied at strides 1, 2, 4 this is u * F^(tensor 3), no bit reversal.
  for (const [stage, stride] of [[0, 1], [1, 2], [2, 4]]) {
    const x = 228 + stage * 171;
    for (let i = 0; i < 8; i++) {
      if ((i & stride) !== 0) continue;
      const j = i + stride;
      result += line(x - 44, ys[j], x, ys[i], 'sc-accent-wire');
      result += circle(x - 44, ys[j], 3.5, 'sc-dot');
      result += circle(x, ys[i], 9, 'sc-xor');
      result += line(x - 5, ys[i], x + 5, ys[i], 'sc-accent-wire') + line(x, ys[i] - 5, x, ys[i] + 5, 'sc-accent-wire');
    }
    result += center(x, 380, `2${'⁰¹²'[stage]}`, 'sc-small sc-mono');
  }
  result += line(44, 397, 716, 397, 'sc-rule') + t(44, 432, math('x = u F^{⊗3}', 'xuF'), 'sc-math') + t(270, 432, l === labels.polar.ru ? 'без перестановки битов' : 'without bit reversal', 'sc-small');
  if (expanded) result += t(44, 455, l[9], 'sc-tiny');
  return result;
}

function constellation(cx, cy, angle, arrow) {
  let result = '';
  for (const offset of [-78, -26, 26, 78]) result += line(cx + offset, cy - 118, cx + offset, cy + 118, 'sc-grid') + line(cx - 118, cy + offset, cx + 118, cy + offset, 'sc-grid');
  result += line(cx - 125, cy, cx + 126, cy, 'sc-wire', arrow) + line(cx, cy + 125, cx, cy - 126, 'sc-wire', arrow);
  result += t(cx + 135, cy + 8, math('I'), 'sc-small sc-math') + t(cx + 10, cy - 134, math('Q'), 'sc-small sc-math');
  for (const real of [-3, -1, 1, 3]) for (const imaginary of [-3, -1, 1, 3]) {
    const re = 26 * (real * Math.cos(angle) - imaginary * Math.sin(angle));
    const im = 26 * (real * Math.sin(angle) + imaginary * Math.cos(angle));
    result += circle(+(cx + re).toFixed(3), +(cy - im).toFixed(3), 6, 'sc-dot');
  }
  return result;
}

function dsp(l, expanded, arrow) {
  let result = '' + constellation(188, 223, Math.PI / 9, arrow) + constellation(560, 223, 0, arrow);
  result += center(188, 376, l[3], 'sc-small') + center(560, 376, l[4], 'sc-small');
  result += line(356, 223, 391, 223, 'sc-accent-wire', arrow) + center(374, 191, math('−φ'), 'sc-math');
  result += line(44, 397, 716, 397, 'sc-rule') + t(44, 432, expanded ? math('r = s e^{jφ}  →  ŝ = r e^{−jφ} = s') : l[7], expanded ? 'sc-math' : 'sc-small');
  if (expanded) result += t(44, 455, l[7], 'sc-tiny');
  return result;
}

function hero(l, expanded, arrow) {
  let result = '';
  // Deliberately schematic topology: no calculated field pattern or gain.
  result += path('M154 265 L630 149 L159 325 Z', 'sc-beam') + path('M164 293 L626 337 L152 333 Z', 'sc-beam sc-beam-secondary');
  result += path('M168 283 L620 154', 'sc-wire sc-dashed', arrow) + path('M168 310 L619 329', 'sc-wire sc-dashed', arrow);
  result += path('M158 251 L326 165', 'sc-accent-wire', arrow) + path('M456 168 L617 148', 'sc-accent-wire', arrow);
  result += surface(344, 83, 5, 3, 25);
  result += rect(96, 221, 66, 126, 'sc-array', 5);
  for (let row = 0; row < 5; row++) for (let col = 0; col < 2; col++) result += circle(115 + col * 28, 238 + row * 23, 5.3, 'sc-dot');
  result += path('M129 347 V367 M105 367 H153', 'sc-wire sc-strong');
  result += terminal(650, 146, 'UE₁', 1.08) + terminal(650, 332, 'UE₂', 1.08);
  result += t(52, 399, l[3], 'sc-small') + t(368, 69, l[6], 'sc-small');
  result += t(235, 181, math('G', 'G'), 'sc-math') + t(534, 117, math('h_{r,1}^H', 'h'), 'sc-math') + t(441, 257, math('h_{d,1}^H', 'h'), 'sc-math') + t(431, 351, math('h_{d,2}^H', 'h'), 'sc-math');
  return result;
}

// At a 244 px card width, 40 SVG units become 12.8 CSS px. These are
// independently composed diagrams, not enlarged text laid over the full ones.
// Keep every mobile label >= 40 units and reserve space for both languages.
function mobileTerminal(x, y, label) {
  return rect(x - 22, y - 36, 44, 72, 'sc-device', 7)
    + line(x - 10, y + 23, x + 10, y + 23, 'sc-wire')
    + center(x, y + 83, label, 'sc-mono');
}

function mobileAccess(lang, arrow) {
  const ru = lang === 'ru';
  let result = `<g data-sc-flow="common">${rect(44, 57, 200, 62, 'sc-box sc-common')}${center(144, 101, math('p_c s_c', 'p'), 'sc-math')}</g>`;
  result += `<g data-sc-flow="private">${rect(44, 179, 200, 62)}${center(144, 223, math('∑ p_k s_k', 'p'), 'sc-math')}</g>`;
  result += path('M244 88 H269 V151 H303 M244 210 H269 V151', 'sc-wire', arrow) + rect(315, 55, 56, 194, 'sc-array');
  for (let i = 0; i < 5; i++) result += circle(343, 75 + i * 38, 8, 'sc-dot');
  result += center(343, 299, math('N'), 'sc-math');
  for (const [index, x, y] of [['1', 656, 67], ['2', 656, 168], ['K', 656, 287]]) {
    result += line(385, 151, x - 38, y, 'sc-accent-wire', arrow);
    result += rect(x - 18, y - 30, 36, 60, 'sc-device') + t(x + 31, y + 15, math(index), 'sc-math');
  }
  result += center(658, 235, '⋮', 'sc-math');
  result += line(44, 337, 716, 337, 'sc-rule') + t(44, 412, math('y_k'), 'sc-math') + line(110, 398, 163, 398, 'sc-wire', arrow);
  result += `<g data-sc-flow="common">${rect(179, 361, 143, 76, 'sc-box sc-common')}${center(250, 413, math('s_c'), 'sc-equation')}${line(329, 398, 368, 398, 'sc-accent-wire', arrow)}</g>`;
  result += rect(383, 361, 131, 76) + center(449, 411, 'SIC', 'sc-mono') + line(521, 398, 560, 398, 'sc-wire', arrow);
  result += `<g data-sc-flow="private">${rect(575, 361, 141, 76)}${center(645, 413, math('s_k'), 'sc-equation')}</g>`;
  return result;
}

function mobileMimo(lang, arrow) {
  let result = t(44, 62, 'MIMO', 'sc-mono')
    + t(47, 181, math('s_1'), 'sc-math') + t(47, 291, math('s_2'), 'sc-math');
  result += path('M103 168 H122 V200 H143 M103 278 H122 V246 H143', 'sc-wire', arrow)
    + rect(155, 126, 119, 203, 'sc-box sc-common', 8) + center(215, 245, math('P', 'P'), 'sc-equation');
  result += line(283, 227, 327, 227, 'sc-accent-wire', arrow) + rect(344, 122, 72, 210, 'sc-array', 7);
  for (let i = 0; i < 6; i++) result += circle(380, 145 + i * 33, 8, 'sc-dot');
  result += path('M428 188 Q509 98 606 101 Q555 164 428 216 Z', 'sc-beam')
    + path('M428 250 Q548 272 608 320 Q523 322 428 282 Z', 'sc-beam sc-beam-secondary')
    + line(430, 201, 611, 132, 'sc-accent-wire', arrow) + line(430, 265, 611, 303, 'sc-accent-wire', arrow);
  result += mobileTerminal(663, 125, 'UE₁') + mobileTerminal(663, 304, 'UE₂');
  result += t(485, 89, math('h_1^H', 'h'), 'sc-math') + t(483, 382, math('h_2^H', 'h'), 'sc-math');
  result += line(44, 404, 716, 404, 'sc-rule') + center(380, 451, math('x = Ps', 'xPs'), 'sc-math');
  return result;
}

function mobileRis(lang, arrow) {
  let result = t(44, 62, 'RIS', 'sc-mono') + t(583, 92, math('φ_n'), 'sc-math')
    + surface(332, 83, 4, 3, 49);
  result += tx(115, 283, 1.1) + rect(630, 295, 45, 74, 'sc-device', 7)
    + line(642, 354, 663, 354, 'sc-wire');
  result += line(160, 285, 302, 206, 'sc-accent-wire', arrow)
    + line(497, 246, 613, 313, 'sc-accent-wire', arrow);
  result += center(115, 426, 'Tx', 'sc-mono') + center(653, 426, 'Rx', 'sc-mono')
    + center(380, 448, lang === 'ru' ? 'Без усиления' : 'No amplification');
  return result;
}

function mobilePolar(lang) {
  const ys = Array.from({ length: 8 }, (_, i) => 111 + 39 * i);
  let result = t(44, 62, math('N = 8'), 'sc-math') + t(569, 62, 'GF(2)', 'sc-mono');
  for (let i = 0; i < 8; i++) {
    result += circle(68, ys[i], 6, 'sc-dot') + line(68, ys[i], 691, ys[i], 'sc-wire');
  }
  // Same transform as the full diagram. Omit row indices and the illustrative
  // frozen-position legend, not wires: all eight bits and twelve XORs remain.
  for (const [stage, stride] of [[0, 1], [1, 2], [2, 4]]) {
    const x = 230 + stage * 190;
    for (let i = 0; i < 8; i++) {
      if ((i & stride) !== 0) continue;
      const j = i + stride;
      result += line(x - 80, ys[j], x, ys[i], 'sc-accent-wire')
        + circle(x - 80, ys[j], 4.4, 'sc-dot') + circle(x, ys[i], 11, 'sc-xor')
        + line(x - 6, ys[i], x + 6, ys[i], 'sc-accent-wire')
        + line(x, ys[i] - 6, x, ys[i] + 6, 'sc-accent-wire');
    }
  }
  result += center(380, 450, math('x = u F^{⊗3}', 'xuF'), 'sc-math');
  return result;
}

function mobileConstellation(cx, cy, angle, arrow) {
  let result = '';
  for (const offset of [-66, -22, 22, 66]) result += line(cx + offset, cy - 105, cx + offset, cy + 105, 'sc-grid') + line(cx - 105, cy + offset, cx + 105, cy + offset, 'sc-grid');
  result += line(cx - 115, cy, cx + 115, cy, 'sc-wire', arrow)
    + line(cx, cy + 115, cx, cy - 115, 'sc-wire', arrow)
    + t(cx + 130, cy + 13, math('I'), 'sc-math') + t(cx + 12, cy - 130, math('Q'), 'sc-math');
  for (const real of [-3, -1, 1, 3]) for (const imaginary of [-3, -1, 1, 3]) {
    const re = 22 * (real * Math.cos(angle) - imaginary * Math.sin(angle));
    const im = 22 * (real * Math.sin(angle) + imaginary * Math.cos(angle));
    result += circle(+(cx + re).toFixed(3), +(cy - im).toFixed(3), 8, 'sc-dot');
  }
  return result;
}

function mobileDsp(lang, arrow) {
  const ru = lang === 'ru';
  let result = center(190, 62, ru ? 'До' : 'Before') + center(570, 62, ru ? 'После' : 'After');
  result += mobileConstellation(190, 242, Math.PI / 9, arrow) + mobileConstellation(570, 242, 0, arrow)
    + line(359, 242, 399, 242, 'sc-accent-wire', arrow) + center(380, 197, math('−φ'), 'sc-math');
  result += line(44, 397, 716, 397, 'sc-rule') + center(380, 447, ru ? '16-QAM · пример' : '16-QAM · example');
  return result;
}

function mobileHero(lang, arrow) {
  let result = center(455, 67, lang === 'ru' ? 'Пассивная RIS' : 'Passive RIS');
  result += path('M173 271 L621 191 L173 312 Z', 'sc-beam')
    + path('M173 299 L621 340 L173 335 Z', 'sc-beam sc-beam-secondary')
    + line(177, 287, 620, 194, 'sc-wire sc-dashed', arrow) + line(177, 315, 620, 340, 'sc-wire sc-dashed', arrow);
  result += line(175, 247, 334, 166, 'sc-accent-wire', arrow) + line(502, 163, 621, 186, 'sc-accent-wire', arrow)
    + surface(359, 93, 4, 2, 43);
  result += rect(75, 217, 91, 147, 'sc-array', 7);
  for (let row = 0; row < 4; row++) for (let col = 0; col < 2; col++) result += circle(102 + col * 37, 240 + row * 34, 8, 'sc-dot');
  result += center(120, 415, lang === 'ru' ? 'Антенная' : 'Antenna') + center(120, 458, lang === 'ru' ? 'решётка' : 'array') + mobileTerminal(669, 184, 'UE₁') + mobileTerminal(669, 338, 'UE₂');
  return result;
}

function renderDiagram(kind, lang = 'ru', variant = 'compact', idPrefix = 'fig') {
  if (!Object.hasOwn(labels, kind)) throw new Error(`Unknown scientific diagram: ${kind}`);
  if (lang !== 'ru' && lang !== 'en') throw new Error(`Unsupported diagram language: ${lang}`);
  if (!['compact', 'expanded'].includes(variant)) throw new Error(`Unknown diagram variant: ${variant}`);
  const id = `${String(idPrefix).replace(/[^a-zA-Z0-9_-]/g, '-')}-${kind}-${lang}-${variant}`;
  const l = labels[kind][lang];
  const arrow = `marker-end="url(#${id}-arrow)"`;
  const draw = { access, mimo, ris, polar, dsp, hero }[kind];
  const drawMobile = { access: mobileAccess, mimo: mobileMimo, ris: mobileRis, polar: mobilePolar, dsp: mobileDsp, hero: mobileHero }[kind];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 470" width="760" height="470" role="img" aria-labelledby="${id}-title ${id}-desc" class="sc-diagram sc-diagram-${kind} sc-diagram-${variant}" data-sc-diagram="${kind}"><title id="${id}-title">${escape(l[0])}</title><desc id="${id}-desc">${escape(l[1])}</desc><defs><marker id="${id}-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 L7 4 L1 7" fill="none" stroke="var(--sc-accent, #086f70)" stroke-width="1.4" stroke-linejoin="round"/></marker></defs><style>
.sc-diagram{color:var(--sc-ink,#172f38);display:block;max-width:100%;height:auto;overflow:visible}
.sc-diagram .sc-label{fill:var(--sc-ink,#172f38);font-family:"Segoe UI",Arial,sans-serif;font-size:22px;font-weight:500}
.sc-diagram .sc-overline{font-size:22px;letter-spacing:.4px}
.sc-diagram .sc-small{font-size:21px}.sc-diagram .sc-tiny{font-size:17px;fill:var(--sc-muted,#5b7075)}
.sc-diagram .sc-math{font-family:"Cambria Math","DejaVu Sans",serif;font-size:28px;font-style:normal}
.sc-diagram .sc-scalar{font-style:italic;font-weight:400}.sc-diagram .sc-vector{font-style:normal;font-weight:700}.sc-diagram .sc-upright{font-style:normal;font-weight:400}
.sc-diagram .sc-mono{font-family:Consolas,"Liberation Mono",monospace}.sc-diagram .sc-equation{font-size:40px;font-family:"Cambria Math",serif}
.sc-diagram .sc-wire,.sc-diagram .sc-accent-wire,.sc-diagram .sc-rule,.sc-diagram .sc-grid{fill:none;stroke:var(--sc-muted,#5b7075);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.sc-diagram .sc-accent-wire{stroke:var(--sc-accent,#086f70);stroke-width:2.4}.sc-diagram .sc-strong{stroke:var(--sc-ink,#172f38);stroke-width:2.5}
.sc-diagram .sc-faint{opacity:.35}.sc-diagram .sc-dashed{stroke-dasharray:5 7}.sc-diagram .sc-rule{stroke:var(--sc-line,#c4d4d3);stroke-width:1}
.sc-diagram .sc-grid{stroke:var(--sc-line,#c4d4d3);stroke-width:1;stroke-dasharray:2 5}
.sc-diagram .sc-box,.sc-diagram .sc-node,.sc-diagram .sc-sum,.sc-diagram .sc-device,.sc-diagram .sc-array{fill:var(--sc-paper,#f6f7f2);stroke:var(--sc-muted,#5b7075);stroke-width:1.7}
.sc-diagram .sc-common{fill:var(--sc-surface,#e9efea);stroke:var(--sc-accent,#086f70);stroke-width:2.2}
.sc-diagram .sc-dot{fill:var(--sc-accent,#086f70);stroke:none}.sc-diagram .sc-device{stroke:var(--sc-ink,#172f38);stroke-width:2.4}
.sc-diagram .sc-beam{fill:var(--sc-accent,#086f70);fill-opacity:.10;stroke:var(--sc-accent,#086f70);stroke-opacity:.3;stroke-width:1}
.sc-diagram .sc-beam-secondary{fill-opacity:.05;stroke-dasharray:4 5}.sc-diagram .sc-tile{fill:var(--sc-surface,#e9efea);stroke:var(--sc-accent,#086f70);stroke-width:1.5;stroke-linejoin:round}
.sc-diagram .sc-xor{fill:var(--sc-paper,#f6f7f2);stroke:var(--sc-accent,#086f70);stroke-width:2}
.sc-diagram .sc-frozen{fill:var(--sc-surface,#e9efea);stroke:var(--sc-line,#c4d4d3);stroke-width:1}.sc-diagram .sc-info{fill:var(--sc-paper,#f6f7f2);stroke:var(--sc-accent,#086f70);stroke-width:1.7}
.sc-diagram .sc-mobile{display:none}.sc-diagram .sc-mobile .sc-label{font-size:40px}.sc-diagram .sc-mobile .sc-math{font-size:46px}.sc-diagram .sc-mobile .sc-equation{font-size:52px}
.sc-diagram .sc-mobile .sc-wire,.sc-diagram .sc-mobile .sc-accent-wire{stroke-width:3.2}.sc-diagram .sc-mobile .sc-grid{stroke-width:1.8}
.sc-diagram .sc-mobile .sc-device,.sc-diagram .sc-mobile .sc-array,.sc-diagram .sc-mobile .sc-box,.sc-diagram .sc-mobile .sc-xor{stroke-width:2.8}
.sc-diagram .sc-mobile .sc-tile{stroke-width:2.4}.sc-diagram .sc-mobile .sc-dashed{stroke-dasharray:9 10}
@media(max-width:620px){.sc-diagram:not([data-sc-detail="full"]) .sc-desktop{display:none}.sc-diagram:not([data-sc-detail="full"]) .sc-mobile{display:inline}}
@media(prefers-reduced-motion:reduce){.sc-diagram *{animation:none!important;transition:none!important}}
</style><g class="sc-desktop">${draw(l, variant === 'expanded', arrow)}</g><g class="sc-mobile">${drawMobile(lang, arrow)}</g></svg>`;
}

module.exports = { renderDiagram };
