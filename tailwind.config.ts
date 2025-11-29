import type { Config } from "tailwindcss";

const config: Config = {
  // 这里配置 tailwind 需要扫描的文件路径
  content: [
    // 如果你使用了 src 目录，必须包含 src 开头的路径
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",

    // 如果根目录下也有相关文件（防止遗漏），可以保留这些
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;