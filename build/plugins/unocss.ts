import process from 'node:process';
import path from 'node:path';
import fs from 'node:fs';
import unocss from '@unocss/vite';
import presetIcons from '@unocss/preset-icons';

// 简单的图标加载器实现，不依赖 @iconify/utils
function simpleFileSystemIconLoader(dir: string, transform?: (svg: string) => string) {
  return async (name: string) => {
    const filepath = path.resolve(dir, `${name}.svg`);
    if (!fs.existsSync(filepath)) return;
    
    let content = await fs.promises.readFile(filepath, 'utf8');
    if (transform) content = transform(content);
    return content;
  };
}

export function setupUnocss(viteEnv: Env.ImportMeta) {
  // 添加默认值，防止环境变量未定义
  const VITE_ICON_PREFIX = viteEnv.VITE_ICON_PREFIX || 'icon';
  const VITE_ICON_LOCAL_PREFIX = viteEnv.VITE_ICON_LOCAL_PREFIX || 'icon-local';

  const localIconPath = path.join(process.cwd(), 'src/assets/svg-icon');

  /** The name of the local icon collection */
  const collectionName = VITE_ICON_LOCAL_PREFIX.replace(`${VITE_ICON_PREFIX}-`, '');

  return unocss({
    presets: [
      presetIcons({
        prefix: `${VITE_ICON_PREFIX}-`,
        scale: 1,
        extraProperties: {
          display: 'inline-block'
        },
        collections: {
          [collectionName]: simpleFileSystemIconLoader(localIconPath, svg =>
            svg.replace(/^<svg\s/, '<svg width="1em" height="1em" ')
          )
        },
        warn: true
      })
    ]
  });
}
