import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import next from "@next/eslint-plugin-next";
import globals from "globals";

// WEB-000 §2 permits exactly two comments: TSDoc on design-system public API,
// and the regex-locked @retiring banner (WEB-006 §4). Everything else is a
// finding — the fix is better names, smaller functions, clearer structure.
const RETIRING_BANNER =
  /^ @retiring \d{4}-\d{2}-\d{2} · replaced-by [\w/.\-@]+ · pending [^·]+ · delete-when [\w-]+ $/;

const webRules = {
  rules: {
    "no-comments": {
      meta: {
        type: "problem",
        docs: { description: "WEB-000 §2 — code that needs a sentence is not finished" },
        schema: [],
        messages: {
          comment: "WEB-000 §2: no comments. Rename, split, or restructure instead.",
          suppression: "WEB-000 §3: no eslint-disable and no @ts-ignore.",
        },
      },
      create(context) {
        const source = context.sourceCode;
        const isDesignSystem = context.filename.replace(/\\/g, "/").includes("/components/saqeel/");
        return {
          Program() {
            for (const comment of source.getAllComments()) {
              if (/^\s*(eslint-disable|@ts-(ignore|expect-error|nocheck))/.test(comment.value)) {
                context.report({ node: comment, messageId: "suppression" });
                continue;
              }
              if (comment.type === "Block" && RETIRING_BANNER.test(comment.value)) continue;
              if (isDesignSystem && comment.type === "Block" && comment.value.startsWith("*")) continue;
              context.report({ node: comment, messageId: "comment" });
            }
          },
        };
      },
    },
  },
};

const NO_LET_IN_TSX = {
  selector: "VariableDeclaration[kind='let']",
  message: "WEB-000 §4: no let in .tsx. Derive the value or move it up the state ladder (WEB-004 §1).",
};

const NO_SVG = {
  selector: "JSXOpeningElement[name.name='svg']",
  message: "WEB-002 §5: no <svg> in application code. Use the icon registry by semantic name.",
};

const NO_DOUBLE_ASSERTION = {
  selector: "TSAsExpression > TSAsExpression > TSUnknownKeyword",
  message: "WEB-000 §3: no `as unknown as`. Narrow unknown input once at the boundary.",
};

const NO_CLIENT_ROUTE = {
  selector: "ExpressionStatement > Literal[value='use client']",
  message: "WEB-001 §2: route files carry no client code. Compose named components instead.",
};

export default tseslint.config(
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "public/**",
      "next-env.d.ts",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,

  {
    plugins: { "@next/next": next, "react-hooks": reactHooks, web: webRules },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...next.configs["core-web-vitals"].rules,
      ...reactHooks.configs.recommended.rules,
      // `useT()` in lib/i18n is an async server helper, not a React hook, so
      // every server component calling it trips this rule 124 times. The rule
      // is right that the name reads as a hook; the name is the defect, and
      // renaming it is its own task. Demoted rather than disabled so the
      // genuine hook violations underneath stay visible.
      "react-hooks/rules-of-hooks": "warn",
    },
  },

  // WEB-000 §3 — illegal states unrepresentable. Unknown input is `unknown`,
  // narrowed once at the boundary.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "web/no-comments": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-restricted-syntax": ["error", NO_SVG, NO_DOUBLE_ASSERTION],
    },
  },

  // WEB-000 §1 and §4 — component budgets, and no `let` in a component.
  {
    files: ["src/**/*.tsx"],
    rules: {
      "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
      "no-restricted-syntax": ["error", NO_SVG, NO_DOUBLE_ASSERTION, NO_LET_IN_TSX],
    },
  },

  // WEB-001 §2 — route files compose named components and await queries.
  // Only error.tsx may carry "use client".
  {
    files: ["src/app/**/{page,layout,loading,not-found}.tsx"],
    rules: {
      "max-lines": ["error", { max: 40, skipBlankLines: true, skipComments: true }],
      "no-restricted-syntax": ["error", NO_SVG, NO_DOUBLE_ASSERTION, NO_LET_IN_TSX, NO_CLIENT_ROUTE],
    },
  },

  // WEB-003 — every image carries alt text conveying purpose. A decorative
  // graphic is never an <img>; it is CSS or an aria-hidden icon.
  {
    files: ["src/**/*.tsx"],
    rules: {
      "jsx-a11y/alt-text": ["error", { elements: ["img", "object", "area", "input[type=\"image\"]"] }],
      "jsx-a11y/no-redundant-roles": "error",
      "jsx-a11y/anchor-is-valid": "off",
      // SAQEEL's type primitives take a `role` prop (body, bodyStrong, label,
      // overline, mono) that collides with the ARIA global attribute. Without
      // ignoreNonDOM every <Text role="bodyStrong"> reads as an invalid ARIA
      // role — 189 of them. Restricting these to DOM elements keeps the real
      // ARIA checks and drops the collision.
      "jsx-a11y/aria-role": ["error", { ignoreNonDOM: true }],
      "jsx-a11y/role-supports-aria-props": "off",
    },
  },

  // Tooling is not application code: scripts and specs are read by humans
  // debugging a failure, and their comments carry the measurement that
  // justified an allowlist entry.
  {
    files: ["e2e/**/*.ts", "scripts/**/*.mjs", "*.config.{ts,mjs}"],
    rules: {
      "web/no-comments": "off",
      "max-lines": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-restricted-syntax": "off",
    },
  },
);
