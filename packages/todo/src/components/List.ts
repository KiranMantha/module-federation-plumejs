import { Component, html } from '@plumejs/core';

@Component({
  selector: 'app-todo-list'
})
export class TodoList {
  static observedProperties = <const>['todos'];
  todos: string[] = [];

  render() {
    return html`
      <ul>
        ${this.todos.map((todo) => html`<li>${todo}</li>`)}
      </ul>
    `;
  }
}
