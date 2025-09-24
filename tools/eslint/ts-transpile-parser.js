import * as espree from "espree";
import ts from "typescript";

const DEFAULT_COMPILER_OPTIONS = {
  jsx: ts.JsxEmit.Preserve,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  useDefineForClassFields: true,
};

const DEFAULT_PARSE_OPTIONS = {
  ecmaVersion: 2022,
  sourceType: "module",
  ecmaFeatures: {
    jsx: true,
  },
  loc: true,
  range: true,
  comment: true,
  tokens: true,
};

function transpile(code, filePath) {
  const compilerOptions = {
    ...DEFAULT_COMPILER_OPTIONS,
    jsx: filePath.endsWith(".tsx") ? ts.JsxEmit.Preserve : DEFAULT_COMPILER_OPTIONS.jsx,
  };

  const result = ts.transpileModule(code, {
    compilerOptions,
    fileName: filePath,
    reportDiagnostics: false,
  });

  return result.outputText;
}

const parser = {
  parse(code, options = {}) {
    const filePath = options.filePath ?? "file.tsx";

    const transpiled = transpile(code, filePath);

    const parserOptions = {
      ...DEFAULT_PARSE_OPTIONS,
      ...options,
      ecmaFeatures: {
        ...DEFAULT_PARSE_OPTIONS.ecmaFeatures,
        ...options.ecmaFeatures,
      },
    };

    const ast = espree.parse(transpiled, parserOptions);
    ast.sourceType = parserOptions.sourceType;
    return ast;
  },
};

parser.meta = {
  name: "ts-transpile-parser",
  version: "1.0.0",
};

export default parser;
