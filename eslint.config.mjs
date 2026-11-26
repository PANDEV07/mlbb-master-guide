import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
 {
  ignores: [
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scratch/**",
    "audit-hero-gameplay.ts",
    "generate-hero-capability-index.ts",
    "normalize-hero-gameplay.ts",
  ],
},
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
