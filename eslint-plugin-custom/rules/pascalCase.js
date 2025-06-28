const plugin = {
  meta: {
    type: "suggestion",
    docs: {
      description: "enforce PascalCase for function declarations and variable-assigned functions",
      recommended: false,
    },
    schema: [], // no options needed
    messages: {
      notPascalCase: "Function '{{name}}' should be named in PascalCase.",
    },
  },
  create(context) {
    // PascalCase regex: starts with uppercase letter, followed by letters/numbers
    const pascalCaseRegex = /^[A-Z][a-zA-Z0-9]*$/;

    function isPascalCase(name) {
      return pascalCaseRegex.test(name);
    }

    function checkName(node, name) {
      if (!isPascalCase(name)) {
        context.report({
          node,
          messageId: "notPascalCase",
          data: { name },
        });
      }
    }

    return {
      // function foo() {}
      FunctionDeclaration(node) {
        if (node.id && node.id.name) {
          checkName(node.id, node.id.name);
        }
      },

      // const foo = function() {} or const foo = () => {}
      VariableDeclarator(node) {
        if (node.id &&
          node.id.type === "Identifier" &&
          (node.init && (node.init.type === "FunctionExpression" || node.init.type === "ArrowFunctionExpression"))) {
          checkName(node.id, node.id.name);
        }
      },
      // class methods and other things can be added later if needed
    };
  }
};

export default plugin;
