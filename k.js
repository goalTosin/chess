// let style = ``
// for (let i = 0; i < 8; i++) {
//   style += `.gr${i} {
//   grid-row: ${i+1};
// }\n`
// }for (let i = 0; i < 8; i++) {
//   style += `.gc${i} {
//   grid-column: ${i+1};
// }\n`
// }

// console.log(style);
let style = ''

let ps = 'pnbrqk'
for (let i = 0; i < ps.length; i++) {
  style += `.w${ps[i]} {
  background-image: url("imgs/w${ps[i]}.png");
}

`
}

for (let i = 0; i < ps.length; i++) {
  style += `.b${ps[i]} {
  background-image: url("imgs/b${ps[i]}.png");
}

`
}

console.log(style);