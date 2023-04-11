// uno.config.ts
import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetTypography,
} from "unocss";
import presetIcons from "@unocss/preset-icons";

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify({
      /* options */
    }),
    presetTypography({
      /* options */
    }),
    presetIcons({
      scale: 1.2,
      cdn: "https://esm.sh/",
    }),
  ],
});
