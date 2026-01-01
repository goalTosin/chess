class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  isNaN() {
    return isNaN(this.x) || isNaN(this.y);
  }
  add(x, y) {
    [x, y] = Vec2.denull(x, y);
    // console.log(x,y);
    this.x += x;
    this.y += y;
    return this;
  }
  sub(x, y) {
    [x, y] = Vec2.denull(x, y);
    this.x -= x;
    this.y -= y;
    return this;
  }
  mul(x, y) {
    [x, y] = Vec2.denull(x, y);
    this.x *= x;
    this.y *= y;
    return this;
  }
  div(x, y) {
    [x, y] = Vec2.denull(x, y);
    this.x /= x;
    this.y /= y;
    return this;
  }
  swap() {
    return new Vec2(this.y, this.x);
  }
  unit() {
    return this.mag() === 0 ? this.clone() : this.clone().div(this.mag());
  }
  mag() {
    return Math.hypot(this.x, this.y);
  }
  dist(x, y) {
    [x, y] = Vec2.denull(x, y);

    return Math.hypot(this.x - x, this.y - y);
  }
  clone() {
    return new Vec2(this.x, this.y);
  }
  set(x, y) {
    [x, y] = Vec2.denull(x, y);
    this.x = x;
    this.y = y;
    return this;
  }
  static denull(x, y) {
    return x.x || x.x === 0 ? [x.x, x.y] : y || y === 0 ? [x, y] : [x, x];
  }
}

class Shape {
  /**
   *
   * @param {number[]} points
   */
  constructor(points) {
    this.points = points;
  }
  getClosestDist(x, y) {
    const l = this.points.length;
    let idx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < l; i += 2) {
      const x1 = this.points[i];
      const y1 = this.points[i + 1];
      const x2 = this.points[(i + 2) % l];
      const y2 = this.points[(i + 3) % l];
      const dist = pointLineDistPerfect(
        { x, y },
        { x: x1, y: y1 },
        { x: x2, y: y2 }
      );
      // i>l&&console.log(i>l);
      if (dist < bestDist) {
        idx = i;
        bestDist = dist;
      }
    }
    // console.log(idx);
    return { i: idx, dist: bestDist };
  }
  getClosestPoint(x, y) {
    const { i } = this.getClosestDist(x, y);
    const l = this.points.length;
    return projectPointOnLine(
      [
        { x: this.points[i], y: this.points[i + 1] },
        { x: this.points[(i + 2) % l], y: this.points[(i + 3) % l] },
      ],
      { x, y }
    );
  }
}

class Ball {
  constructor(pos = new Vec2()) {
    this.pos = pos;
    this.vel = new Vec2();
    this.r = 4;
    this.color = randColor();
    this.restitution = 0.7;
    this.mass = 1;
  }
}
function projectPoint(
  line = [
    { x: 0, y: 0 },
    { x: 10, y: 10 },
  ],
  point = { x: 2, y: 1 }
) {
  const a = dist2(point.x, point.y, line[0].x, line[0].y);
  const b = dist2(point.x, point.y, line[1].x, line[1].y);
  const c = dist2(line[0].x, line[0].y, line[1].x, line[1].y);
  const p = Math.pow;
  return (p(a, 2) - p(b, 2) + p(c, 2)) / (2 * c);
}

function dist2(x0, y0, x1, y1) {
  const distx = x1 - x0;
  const disty = y1 - y0;
  return Math.sqrt(distx * distx + disty * disty);
}

function projectPointOnLine(line, point) {
  function clamp(v, mi, ma) {
    return Math.max(mi, Math.min(ma, v));
  }
  function dist2(x0, y0, x1, y1) {
    const distx = x1 - x0;
    const disty = y1 - y0;
    const dist = Math.sqrt(distx * distx + disty * disty);
    return dist;
  }

  const d = clamp(
    projectPoint(line, point),
    0,
    dist2(line[0].x, line[0].y, line[1].x, line[1].y)
  );

  // console.log(h);
  const dist = Math.hypot(line[0].x - line[1].x, line[0].y - line[1].y);
  const x = line[0].x + ((line[1].x - line[0].x) / dist) * d;
  const y = line[0].y + ((line[1].y - line[0].y) / dist) * d;
  // console.log(dist - e);
  return new Vec2(x, y);
}
function refine(callback, confirm) {
  let r = null;
  while (!confirm((r = callback()))) {}
  return r;
}

function randColor() {
  return "#" + Math.floor(Math.random() * 0xffffff).toString(16);
}

function clamp(v, mi, ma) {
  return Math.max(mi, Math.min(ma, v));
}

function pointLineDistPerfect(point, linePoint1, linePoint2) {
  const p = projectPointOnLine([linePoint1, linePoint2], point);
  return p.sub(point).mag();
}

function path2arr(p) {
  let k = [];
  let x = 0;
  let y = 0;
  for (let i = 0; i < p.length; i += 2) {
    k.push(p[i] + x, p[i + 1] + y);
    x += p[i];
    y += p[i + 1];
  }
  return k;
}

const canvas = document.querySelector("canvas");
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);
const ctx = canvas.getContext("2d");

/**
 * @type {Ball[]}
 */
const balls = [];
/**
 * @type {Shape[]}
 */
const shapes = [].map((p) => new Shape(p.points));
let testShape = [];
const g = new Vec2(0, 0.1);

// for (let i = 0; i < 4; i++) {
//   balls.push(
//     new Ball(new Vec2(Math.random() * 100 - 50, Math.random() * 100 - 50))
//   );
// }
const b = new Ball(new Vec2(0, 0));
b.vel.x = -5;
b.mass = 1
b.r = 50
balls.push(b);

function rotate(shape, deg) {
  const ns = [];
  for (let i = 0; i < shape.length; i += 2) {
    const l = Math.hypot(shape[i], shape[i + 1]);
    const a = Math.atan2(shape[i + 1], shape[i]);
    ns.push(Math.cos(a + deg) * l, Math.sin(a + deg) * l);
  }
  return ns;
}

const box = (x, y, w, h, r = 0) => {
  w = w / 2;
  h = h / 2;
  shapes.push(
    new Shape(rotate([-w, -h, w, -h, w, h, -w, h], r).map((v, i) => v + [x, y][i % 2]))
  );
  // shapes.push(
  //   new Shape(rotate([-w, -h, w, -h, w, h, -w, h], Math.PI/3).map((v, i) => v + [x, y][i % 2]))
  // );
};
let ch = canvas.height
let cw = 500
box(0, ch / 2, cw - 5, 10);
box(0, 50, cw - 5, 10);
box(cw / 2, 0, 10, ch - 5);
box(-cw / 2, 0, 10, ch - 5);
for (let i = 0; i < 20; i++) {
  box(
    -cw / 2 + Math.random() * cw,
    -ch / 2 + Math.random() * ch,
    Math.random() * 5 + 50,
    Math.random() * 10 + 50, Math.random()*Math.PI
  );
}

// let w = 100;
// shapes.push(
//   new Shape(
//     path2arr([5, 0, 0, 50, w, 0, 0, -50, 5, 0, 0, 55, -w - 10, 0, 0, -55])
//   )
// );
// shapes.push(new Shape([
//   -98,
//   -170,
//   4,
//   -170,
//   4,
//   -58,
//   4,
//   -170
// ]))

let test = [];
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  balls.forEach((ball) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(ball.pos.x, ball.pos.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.restore();
  });
  shapes.forEach((s) => {
    ctx.beginPath();
    ctx.moveTo(s.points[0], s.points[1]);
    for (let i = 2; i < s.points.length; i += 2) {
      ctx.lineTo(s.points[i], s.points[i + 1]);
    }
    ctx.fillStyle = "black";
    ctx.fill();
  });
  if (testShape.length > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(testShape[0], testShape[1]);
    for (let i = 2; i < testShape.length; i += 2) {
      ctx.lineTo(testShape[i], testShape[i + 1]);
    }
    ctx.closePath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.setLineDash([3, 6]);
    ctx.stroke();
    ctx.restore();
  }
  test.forEach((t) => {
    t();
  });
  test = [];
  ctx.restore();
}

function update(dt) {
  const nb = Array.from({ length: balls.length }).map(() => new Vec2());
  balls.forEach((b, i) => {
    b.pos.add(b.vel.clone().mul(dt));
    nb[i].add(g.clone().mul(dt));

    // if (b.pos.y + b.r > canvas.height / 2) {
    //   b.pos.y = canvas.height / 2 - b.r;
    //   b.vel.y *= -1;
    // }
    balls.forEach((b2, j) => {
      if (b === b2) {
        return;
      }
      const d = b.pos.dist(b2.pos);
      if (d < b.r + b2.r && d !== 0) {
        const normal = b2.pos.clone().sub(b.pos).unit();
        const m1 = b.mass / (b.mass + b2.mass);
        const m2 = b2.mass / (b.mass + b2.mass);
        const mvb = b.mass * b.vel.mag() + b2.mass * b2.vel.mag();
        // if (normal.mag() === 0) {

        // }
        // console.log(normal);
        // normal.clone().mul(b2.vel.mag() * mv1).isNaN()&&console.log(normal.clone().mul(b2.vel.mag() * mv1).isNaN());
        // b2.pos.add(normal.clone().mul((b.r + b2.r - d) * m1));
        // b.pos.add(normal.clone().mul((b.r + b2.r - d) * -m2));

        if (mvb !== 0) {
          const mv1 = (b.mass * b.vel.mag()) / mvb;
          const mv2 = (b2.mass * b2.vel.mag()) / mvb;
        b2.pos.add(normal.clone().mul(b2.vel.mag() * mv1));
        b.pos.add(normal.clone().mul(b.vel.mag() * -mv2));
          nb[j].add(normal.clone().mul(b2.vel.mag() * mv1));
          nb[i].add(normal.clone().mul(b.vel.mag() * -mv2));
        }
      }
    });
    shapes.forEach((s) => {
      const l = s.points.length;
      const re = s.getClosestDist(b.pos.x, b.pos.y);
      if (re.dist < b.r) {
        // console.log("col!");
        const p1 = new Vec2(s.points[re.i], s.points[re.i + 1]);
        const p2 = new Vec2(s.points[(re.i + 2) % l], s.points[(re.i + 3) % l]);
        const normal = p2.clone().sub(p1).unit().swap().mul(1, -1);
        let v = s.getClosestPoint(b.pos.x, b.pos.y);
        // b.pos.set(
        //   s.getClosestPoint(b.pos.x, b.pos.y).add(normal.clone().mul(b.r))
        // );
        let vs = normal.clone().mul(
          b.vel.mag() *
            // Math.abs(
            Math.sin(
              Math.atan2(p1.y - p2.y, p1.x - p2.x) -
                Math.atan2(b.vel.y, b.vel.x)
              //  )
            ) *
            (1 + b.restitution)
        );
        b.pos.add(vs)
        // console.log(
        // Math.atan2(p1.y - p2.y, p1.x - p2.x)-
        // Math.atan2(b.vel.y, b.vel.x) *180/Math.PI
        // vs
        // );

        nb[i].add(vs);

        test.push(() => {
          // ctx.beginPath();
          // ctx.arc(v.x, v.y, 4, 0, Math.PI * 2);
          // ctx.fillStyle = "red";
          // ctx.fill();
          ctx.beginPath();
          ctx.moveTo(v.x, v.y);
          ctx.lineTo(v.x + vs.x * 400, v.y + vs.y * 400);
          ctx.lineWidth = 1;
          ctx.strokeStyle = "purple";
          ctx.stroke();
        });
      }
    });
  });
  balls.forEach((b, i) => {
    b.vel.add(nb[i]);
  });
}

let lps = 0;
let lts = 0;
let cx = 0;
let cy = 0;

function animate() {
  if (lps === 0 || Date.now() - lps >= 1000) {
    const fps = 1000 / (performance.now() - lts);
    console.log(fps);
    lps = Date.now();
  }
  // update(60/45);
  update(0.5);
  update(0.5);
  draw();
  lts = performance.now();
  setTimeout(animate, 1000 / 60);
}
animate();

let mouse = {
  down: false,
  x: 0,
  y: 0,
};
addEventListener("mousedown", (e) => {
  const bb = canvas.getBoundingClientRect();
  mouse.down = true;
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  if (!e.ctrlKey) {
    let n = 5
    for (let i = 0; i < n; i++) {
      balls.push(
        new Ball(
          new Vec2(
            e.clientX - canvas.width / 2 - bb.left + (i-(n-1)/2) * 41, //+ Math.random() * 50 - 25,
            e.clientY - canvas.height / 2 - bb.top //+ Math.random()*50-25
          )
        )
      );
    }
  }
});

addEventListener("mousemove", (e) => {
  const bb = canvas.getBoundingClientRect();
  if (mouse.down && e.ctrlKey) {
    testShape = [
      mouse.x - canvas.width / 2 - bb.left,
      mouse.y - canvas.height / 2 - bb.top,
      e.clientX - canvas.width / 2 - bb.left,
      mouse.y - canvas.height / 2 - bb.top,
      e.clientX - canvas.width / 2 - bb.left,
      e.clientY - canvas.height / 2 - bb.top,
      mouse.x - canvas.width / 2 - bb.left,
      e.clientY - canvas.height / 2 - bb.top,
    ];
  }
});

addEventListener("mouseup", (e) => {
  if (mouse.down && testShape.length === 8) {
    mouse.down = false;
    shapes.push(new Shape(testShape));
    console.log(shapes.at(-1));
    testShape = [];
  }
});
