'use strict';

// Curated summaries, not a second project archive. Full records remain in
// quarto-site/{ru,en}/projects.qmd; the preparation step includes them verbatim.
module.exports = [
  {
    id: 'rsma', diagram: 'access', period: '2024–2026', href: 'research-access.html',
    source: 'projects.qmd / Priority 2030 / RSMA',
    ru: { title: 'Множественный доступ с разделением по скорости', type: 'Модель · алгоритмы', text: 'Имитационная модель RSMA с полярными кодами, адаптивное прекодирование и распределение мощности.' },
    en: { title: 'Rate-splitting multiple access', type: 'Model · algorithms', text: 'An RSMA simulation model with polar coding, adaptive precoding and power allocation.' }
  },
  {
    id: 'ris', diagram: 'ris', photo: 'ris/anechoic-chamber-prototype.jpg', period: { ru: 'С 2023 года', en: 'Since 2023' }, href: 'research-metasurfaces.html',
    source: 'projects.qmd / Advanced Engineering School 2023–2025, UMNIK 2024–2025; research-metasurfaces.qmd',
    ru: { title: 'От модели радиоканала к прототипу RIS', type: 'Модель · прототип', text: 'Моделирование каналов с RIS и экспериментальные поверхности. На фотографии — прототип на 16 элементов в измерительном стенде.', caption: 'Фото лаборатории · 16-элементная RIS в безэховой камере' },
    en: { title: 'From a channel model to a RIS prototype', type: 'Model · prototype', text: 'RIS channel modelling and experimental surfaces. The photograph shows the 16-element prototype in a measurement setup.', caption: 'Laboratory photograph · 16-element RIS in an anechoic chamber' }
  },
  {
    id: 'polar', diagram: 'polar', period: '2026', href: 'research-polar.html',
    source: 'projects.qmd / Priority 2030 / heterogeneous channels',
    ru: { title: 'Полярные коды для неоднородных каналов', type: 'Программное обеспечение', text: 'Зарегистрированная программа для оптимизации отображения битов кода на физические ресурсы.' },
    en: { title: 'Polar codes for heterogeneous channels', type: 'Software', text: 'Registered software for optimizing the mapping of coded bits to physical resources.' }
  },
  {
    id: 'dsp', diagram: 'dsp', period: '2024', href: 'projects.html#industry-contracts',
    source: 'projects.qmd / Industry contracts / Micran',
    ru: { title: 'Обработка сигналов для радиомодемов', type: 'ПО · алгоритмы', text: 'Совместная работа с НПФ «Микран»: программное обеспечение и алгоритмы обработки сигналов для модемов радиорелейных линий.' },
    en: { title: 'Signal processing for radio modems', type: 'Software · algorithms', text: 'Collaboration with Micran on software and signal processing algorithms for radio-relay modems.' }
  },
  {
    id: 'multichannel', diagram: 'mimo', period: '2021', href: 'projects.html#priority-2030',
    source: 'projects.qmd / Priority 2030 / multichannel prototype',
    ru: { title: 'Экспериментальная многоканальная система', type: 'Экспериментальный макет', text: 'Разработка макета многоканальной системы связи с неортогональным множественным доступом.' },
    en: { title: 'An experimental multichannel system', type: 'Experimental prototype', text: 'Development of a multichannel communication prototype with non-orthogonal multiple access.' }
  }
];
