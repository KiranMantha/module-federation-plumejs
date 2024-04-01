import { importShared } from './__federation_fn_import-BMh9_mKw.js';

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
const {Component,Renderer,html} = await importShared('@plumejs/core');

let TodoInput = class {
  constructor(renderer) {
    this.renderer = renderer;
  }
  value = "";
  handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    this.renderer.emitEvent("submit", { todo: formData.get("todo") });
    e.target.reset();
  }
  render() {
    return html`
      <form
        onsubmit=${(e) => {
      this.handleSubmit(e);
    }}
      >
        <div className="flex-row">
          <input type="text" name="todo" />
          <button type="submit">Add</button>
        </div>
      </form>
    `;
  }
};
TodoInput = __decorateClass([
  Component({
    selector: "app-todo-input",
    deps: [Renderer]
  })
], TodoInput);

export { TodoInput };
