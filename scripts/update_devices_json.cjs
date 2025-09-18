const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'data', 'devices.json');

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function genName() {
  const subjects = [
    '主变压器', '母线', '线路', '发电机', '母联', '备用电源', '厂用变', '站用电',
    '电容器组', '消弧线圈', 'PT回路', 'CT回路', '低压侧', '高压侧', '母线分段'
  ];
  const funcs = [
    '差动保护', '后备保护', '过流保护', '距离保护', '零序保护', '过负荷保护', '母差保护',
    '重合闸', '跳闸回路', '信号回路', '备自投', '备用跳闸'
  ];
  const qualifiers = [
    '投入', '退出', '允许', '禁止', '复归', '试验', '检修', '闭锁', '遥控', '就地', '远方', '投退'
  ];
  const extras = ['控制', '操作', '运行', '监视', '选择', '定值区'];

  const patterns = [
    (s, f, q) => `${s}${f}${q}压板`,
    (s, f, q) => `${s}${f}${q}控制压板`,
    (s, f, q) => `${s}${f}回路${q}压板`,
    (s, f, q) => `${s}${q}${f}操作压板`,
  ];
  const s = pick(subjects);
  const f = pick(funcs);
  const q = pick(qualifiers);
  let name = pick(patterns)(s, f, q);
  while (name.length < 10) {
    const ex = pick(extras);
    name = name.replace('压板', `${ex}压板`);
  }
  if (name.length > 20) {
    name = name.replace('控制', '').replace('操作', '').replace('回路', '');
  }
  if (name.length > 20) name = name.slice(0, 20);
  return name;
}

const raw = fs.readFileSync(file, 'utf8');
const data = JSON.parse(raw);

const updated = data.map((d) => ({
  ...d,
  type: 'hard',
  pressure_plate_name: genName(),
}));

fs.writeFileSync(file, JSON.stringify(updated, null, 2) + '\n');
console.log('Updated', file, 'items:', updated.length);
