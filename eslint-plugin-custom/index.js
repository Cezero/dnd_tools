import camelCase from './rules/camelCase.js';
import pascalCase from './rules/pascalCase.js';

export default {
  rules: {
    'camelcase-params': camelCase,
    'pascalcase-functions': pascalCase
  }
}