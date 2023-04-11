// uno.config.ts
import { defineConfig, presetUno, presetAttributify } from 'unocss'
import presetIcons from '@unocss/preset-icons'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify({ /* preset options */ }),
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/'
    }),
  ],
})