interface CodexTabProps {
  openSheet: (title: string, text: string) => void;
}

interface WorldCard {
  mark: string;
  tag: string;
  name: string;
  desc: string;
  sheetText: string;
}

const WORLDS: WorldCard[] = [
  {
    mark: 'Ⅰ',
    tag: 'World',
    name: '地球 Online',
    desc: '现实规则，低魔变量，命运常伪装成普通选择。',
    sheetText:
      '现代社会低魔环境。资源、阶层、教育、家庭与偶然事件将成为命运主变量。',
  },
  {
    mark: 'Ⅱ',
    tag: 'World',
    name: '修仙世界',
    desc: '灵根、宗门、秘境、因果，凡骨亦可逆天。',
    sheetText: '灵根、宗门、因果与寿元交织。凡骨亦可逆天，天骄也会陨落。',
  },
  {
    mark: 'Ⅲ',
    tag: 'World',
    name: '真武世界',
    desc: '武馆、战场、家族与江湖声望塑造一生。',
    sheetText:
      '拳意入骨，血气成炉。家族、武馆、战场与江湖声望决定成长轨迹。',
  },
  {
    mark: 'Ⅳ',
    tag: 'Saved',
    name: '自定义图鉴',
    desc: '保存自定义世界、事件池、天赋与命运规则。',
    sheetText:
      '保存你自定义的世界规则、职业路径、事件池、天赋池与专属命运关键词。',
  },
];

const SAVED_CODEX = [
  {
    index: '01',
    name: '赛博灵朝',
    desc: '义体 / 香火神权 / 功德债务',
    state: '已保存',
    sheetText:
      '科技与香火神权并存的自定义世界。核心机制：义体、神龛网络、功德债务。',
  },
  {
    index: '02',
    name: '末日方舟城',
    desc: '配给 / 阶层 / 感染 / 迁徙许可',
    state: '草稿',
    sheetText:
      '资源衰竭后的高墙城市。核心机制：配给、阶层、感染、迁徙许可。',
  },
];

export default function CodexTab({ openSheet }: CodexTabProps) {
  return (
    <div className="tab-page active" style={{ animation: 'fadeUp .32s ease both' }}>
      <SectionHead cn="世界图鉴" en="World Codex" />

      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {WORLDS.map((world) => (
          <article
            key={world.mark}
            className="relative"
            style={{
              minHeight: '132px',
              padding: '17px 15px',
              border: '1px solid rgba(34,29,24,0.13)',
              background: 'rgba(248,244,236,0.26)',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.26s ease',
            }}
            onClick={() => openSheet(world.name, world.sheetText)}
          >
            <div
              style={{
                position: 'absolute',
                right: '11px',
                top: '7px',
                color: 'rgba(34,29,24,0.045)',
                fontSize: '46px',
                lineHeight: 1,
                fontWeight: 300,
              }}
            >
              {world.mark}
            </div>

            <span
              style={{
                display: 'inline-block',
                marginBottom: '17px',
                color: '#7a2020',
                fontSize: '13px',
                letterSpacing: '2px',
              }}
            >
              {world.tag}
            </span>

            <h3
              style={{
                margin: '0 0 9px',
                fontSize: '20px',
                fontWeight: 400,
                letterSpacing: '3px',
                color: '#221d18',
              }}
            >
              {world.name}
            </h3>

            <p
              style={{
                margin: 0,
                color: '#5a5047',
                fontSize: '12px',
                lineHeight: '1.75',
                letterSpacing: '1px',
              }}
            >
              {world.desc}
            </p>
          </article>
        ))}
      </div>

      <SectionHead cn="自定义保存" en="Saved Codex" />

      <div style={{ borderTop: '1px solid rgba(34,29,24,0.13)', marginBottom: '18px' }}>
        {SAVED_CODEX.map((item) => (
          <article
            key={item.index}
            className="grid"
            style={{
              gridTemplateColumns: '42px 1fr auto',
              gap: '12px',
              alignItems: 'center',
              padding: '16px 0',
              borderBottom: '1px solid rgba(34,29,24,0.13)',
              cursor: 'pointer',
            }}
            onClick={() => openSheet(item.name, item.sheetText)}
          >
            <div
              style={{
                color: '#948879',
                fontSize: '22px',
                fontWeight: 300,
              }}
            >
              {item.index}
            </div>
            <div>
              <h3
                style={{
                  margin: '0 0 5px',
                  fontSize: '18px',
                  fontWeight: 400,
                  letterSpacing: '2px',
                  color: '#221d18',
                }}
              >
                {item.name}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: '#948879',
                  fontSize: '12px',
                  letterSpacing: '1px',
                }}
              >
                {item.desc}
              </p>
            </div>
            <div
              style={{
                color: '#7a2020',
                fontSize: '12px',
                letterSpacing: '2px',
              }}
            >
              {item.state}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function SectionHead({ cn, en }: { cn: string; en: string }) {
  return (
    <div
      className="flex justify-between items-end"
      style={{ margin: '0 0 13px' }}
    >
      <span style={{ fontSize: '16px', letterSpacing: '3px', color: '#221d18' }}>
        {cn}
      </span>
      <span
        style={{
          fontSize: '13px',
          letterSpacing: '2px',
          color: '#948879',
          fontStyle: 'italic',
        }}
      >
        {en}
      </span>
    </div>
  );
}
