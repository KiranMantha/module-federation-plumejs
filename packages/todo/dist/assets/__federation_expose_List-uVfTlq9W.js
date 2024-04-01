import { importShared } from './__federation_fn_import-BMh9_mKw.js';

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const {Component,html} = await importShared('@plumejs/core');

let TodoList = class {
  todos = [];
  render() {
    return html`
      <ul>
        ${this.todos.map((todo) => html`<li>${todo}</li>`)}
      </ul>
    `;
  }
};
__publicField(TodoList, "observedProperties", ["todos"]);
TodoList = __decorateClass([
  Component({
    selector: "app-todo-list"
  })
], TodoList);

export { TodoList };
