const plugin = {
  meta: {
    type: "suggestion",
    docs: {
      description: "enforce camelCase naming for function parameters",
      recommended: false,
    },
    schema: [],
    messages: {
      notCamelCase: "Function parameter '{{name}}' should be camelCase.",
    },
  },
  create(context) {
    const camelCaseRegex = /^[a-z][a-zA-Z0-9]*$/;

    function isCamelCase(name) {
      return camelCaseRegex.test(name);
    }

    function checkParams(params) {
      for (const param of params) {
        if (param.type === "Identifier") {
          const name = param.name;
          if (!isCamelCase(name)) {
            context.report({
              node: param,
              messageId: "notCamelCase",
              data: { name },
            });
          }
        }
      }
    }

    return {
      FunctionDeclaration(node) {
        checkParams(node.params);
      },
      FunctionExpression(node) {
        checkParams(node.params);
      },
      ArrowFunctionExpression(node) {
        checkParams(node.params);
      },
    };
  }
};

export default plugin;