declare module 'petite-vue' {
  import { reactive } from 'petite-vue/src/reactivity';
  export { reactive };

  export interface App {
    mount(el?: string | Element): void;
  }

  export function createApp(data?: Record<string, any>): App;
}
