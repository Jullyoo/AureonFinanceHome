(function (Aureon) {
  'use strict';

  const { brl, shortBRL } = Aureon.utils;
  const registry = {};

  const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const palette = () => Array.from({ length: 9 }, (_, i) => token(`--chart-${i + 1}`));

  function draw(canvasId, config) {
    registry[canvasId]?.destroy();
    const canvas = document.getElementById(canvasId);
    if (canvas) registry[canvasId] = new Chart(canvas, config);
  }

  function baseOptions({ legend = false } = {}) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: legend
          ? {
              position: 'bottom',
              labels: { color: token('--chart-tick'), boxWidth: 10, boxHeight: 10, font: { size: 10 } },
            }
          : { display: false },
        tooltip: {
          backgroundColor: token('--chart-tooltip-bg'),
          titleColor: '#fff',
          bodyColor: token('--chart-tooltip-body'),
          borderColor: token('--chart-tooltip-border'),
          borderWidth: 1,
          padding: 11,
          callbacks: { label: (item) => `${item.dataset.label || item.label}: ${brl(item.raw)}` },
        },
      },
    };
  }

  function axes({ maxXTicks, beginAtZero = false, empty = false } = {}) {
    const ticks = { color: token('--chart-tick'), font: { size: 9 } };
    return {
      x: { grid: { display: false }, ticks: { ...ticks, ...(maxXTicks && { maxTicksLimit: maxXTicks }) } },
      y: {
        beginAtZero,
        ...(empty && { suggestedMax: 100 }),
        grid: { color: token('--chart-grid') },
        ticks: { ...ticks, callback: (value) => shortBRL(value) },
      },
    };
  }

  function lineDataset(label, data, color, fill, extra = {}) {
    return {
      label,
      data,
      borderColor: color,
      backgroundColor: fill,
      fill: true,
      tension: 0.38,
      borderWidth: 2,
      ...extra,
    };
  }

  function flow(canvasId, { labels, income, expense }) {
    const [green, gold] = palette();
    const pointRadius = labels.length > 20 ? 0 : 3;
    draw(canvasId, {
      type: 'line',
      data: {
        labels,
        datasets: [
          lineDataset('Entradas', income, green, token('--chart-fill-in'), {
            pointRadius,
            pointBackgroundColor: green,
          }),
          lineDataset('Saídas', expense, gold, token('--chart-fill-out'), { pointRadius, pointBackgroundColor: gold }),
        ],
      },
      options: {
        ...baseOptions(),
        interaction: { mode: 'index', intersect: false },
        scales: axes({ maxXTicks: 10, beginAtZero: true, empty: !income.some(Boolean) && !expense.some(Boolean) }),
      },
    });
  }

  function categories(canvasId, entries) {
    const options = baseOptions();
    options.cutout = '76%';
    options.plugins.tooltip.callbacks.label = (item) => `${item.label}: ${brl(item.raw)}`;
    draw(canvasId, {
      type: 'doughnut',
      data: {
        labels: entries.map(([name]) => name),
        datasets: [
          {
            data: entries.map(([, value]) => value),
            backgroundColor: palette(),
            borderColor: token('--chart-donut-border'),
            borderWidth: 4,
            hoverOffset: 5,
          },
        ],
      },
      options,
    });
  }

  function projection(canvasId, labels, series) {
    const colors = palette();
    draw(canvasId, {
      type: 'line',
      data: {
        labels,
        datasets: series.map((item, i) =>
          lineDataset(item.label, item.data, colors[i], `${colors[i]}12`, { pointRadius: 0, tension: 0.35 }),
        ),
      },
      options: {
        ...baseOptions({ legend: series.length > 1 }),
        interaction: { mode: 'index', intersect: false },
        scales: axes(),
      },
    });
  }

  Aureon.charts = Object.freeze({ flow, categories, projection, palette });
})(window.Aureon);
