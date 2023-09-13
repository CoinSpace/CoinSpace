<script>

const positiveColor = '#68C481';
const positiveGradient = ['rgba(104, 196, 129, 1)', 'rgba(104, 196, 129, 0)'];
const negativeColor = '#DD230E';
const negativeGradient = ['rgba(222, 83, 53, 1)', 'rgba(222, 83, 53, 0)'];

function drawChart(canvas, prices) {
  const { width, height } = canvas.getBoundingClientRect();
  const ctx = canvas.getContext('2d');
  scaleContextToPixelRatio({ canvas, width, height });

  const curves = pricesToBezierCurves({ prices, width, height });
  const [color, gradient] = getColorAndGradient(prices);
  drawBezierCurves({ curves, ctx, color, width, height });
  drawBackground({ ctx, gradient, height });
}

function getColorAndGradient(prices) {
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  if (firstPrice <= lastPrice) {
    return [positiveColor, positiveGradient];
  }
  if (firstPrice > lastPrice) {
    return [negativeColor, negativeGradient];
  }
}

function scaleContextToPixelRatio({ canvas, width, height }) {
  const { devicePixelRatio } = window;
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  canvas.getContext('2d').scale(devicePixelRatio, devicePixelRatio); // make looks great on mobile devices
}

function pricesToBezierCurves({ prices, width, height }) {
  if (prices.length < 2) return [];
  const f = 0.2;
  const t = 1.0;
  const yMin = 1;
  const yMax = height - 1;
  const step = (width + 1) / (prices.length - 1);
  const nomalizedPrices = scaleBetween(prices, yMin, yMax).map((price) => {
    return height - price;
  });
  const points = nomalizedPrices.map((price, i) => {
    return { x: i * step, y: price };
  });

  const bezierCurves = [];
  bezierCurves.push({ x: -1, y: clamp(points[0].y, yMin, yMax) });

  let prevPoint = points[0];
  let m = 0;
  let dx1 = 0;
  let dy1 = 0;
  let dx2 = 0;
  let dy2 = 0;

  for (let i = 1; i < points.length; i++) {
    const currentPoint = points[i];
    const nextPoint = points[i + 1];
    if (nextPoint) {
      m = (nextPoint.y - prevPoint.y) / (nextPoint.x - prevPoint.x);
      dx2 = (nextPoint.x - prevPoint.x) * -f;
      dy2 = dx2 * m * t;
    } else {
      dx2 = 0;
      dy2 = 0;
    }
    const curve = {
      cp1x: prevPoint.x - dx1,
      cp1y: clamp(prevPoint.y - dy1, yMin, yMax),
      cp2x: currentPoint.x + dx2,
      cp2y: clamp(currentPoint.y + dy2, yMin, yMax),
      x: currentPoint.x,
      y: clamp(currentPoint.y, yMin, yMax),
    };
    bezierCurves.push(curve);
    dx1 = dx2;
    dy1 = dy2;
    prevPoint = currentPoint;
  }
  return bezierCurves;
}

function scaleBetween(arr, scaledMin, scaledMax) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  if (min === max) return arr.map(() => (scaledMax - scaledMin) / 2);
  return arr.map(num => (scaledMax - scaledMin) * (num - min) / (max - min) + scaledMin);
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

function drawBezierCurves({ curves, ctx, color, width, height }) {
  ctx.lineWidth = 1;
  ctx.strokeStyle = color;
  curves.forEach(({ cp1x, cp1y, cp2x, cp2y, x, y }, i) => {
    if (i === 0) {
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x, y);
    } else {
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }
  });
  ctx.stroke();
  ctx.lineTo(width, height);
}

function drawBackground({ ctx, gradient, height }) {
  if (!gradient) return;
  const fillStyle = ctx.createLinearGradient(0, 0, 0, height);
  gradient.forEach((color, i) => {
    fillStyle.addColorStop(i, color);
  });
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

export default {
  props: {
    prices: {
      type: Array,
      required: true,
    },
  },
  watch: {
    prices() {
      drawChart(this.$refs.canvas, this.prices);
    },
  },
  mounted() {
    drawChart(this.$refs.canvas, this.prices);
    window.addEventListener('resize', this.resize);
  },
  unmounted() {
    window.removeEventListener('resize', this.resize);
  },
  methods: {
    resize() {
      drawChart(this.$refs.canvas, this.prices);
    },
  },
};
</script>

<template>
  <canvas
    ref="canvas"
    class="&"
  />
</template>

<style lang="scss">
  .#{ $filename } {
    display: block;
    width: 100%;
    height: 10rem;
  }
</style>
