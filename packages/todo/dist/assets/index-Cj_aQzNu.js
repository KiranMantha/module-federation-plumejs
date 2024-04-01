import { importShared } from './__federation_fn_import-BMh9_mKw.js';
import './__federation_expose_Input-DBbC6CYt.js';
import './__federation_expose_List-uVfTlq9W.js';

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
const {Component,html} = await importShared('@plumejs/core');
let AppComponent = class {
  todos = [];
  render() {
    return html`<h1>This is remote todo</h1>
      <app-todo-input
        onsubmit=${(e) => {
      console.log(e.detail.todo);
      this.todos.push(e.detail.todo);
    }}
      ></app-todo-input>
      <app-todo-list data-input=${{ todos: this.todos }}></app-todo-list>`;
  }
};
AppComponent = __decorateClass([
  Component({
    selector: "app-root",
    // styles: import('./styles/styles.scss?inline'),
    root: true
  })
], AppComponent);

export { AppComponent };
