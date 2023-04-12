// uno.config.ts
import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetTypography,
} from "unocss";
import presetIcons from "@unocss/preset-icons";

export default defineConfig({
  shortcuts: {

  },
  presets: [
    presetUno({
      /* options */
    }),
    presetAttributify({
      /* options */
    }),
    presetTypography({
      /* options */
    }),
    presetIcons({
      extraProperties: {
        'display': 'inline-block', // 行内标签大小比较好调整，
        'vertical-align': 'middle',
        /* options */
      },
    }),
  ],
});
