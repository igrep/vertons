import {controller} from '@github/catalyst'

@controller
export class HelloWorldElement extends HTMLElement {
  connectedCallback() {
    this.innerHTML = 'Hello World!'
  }
}
