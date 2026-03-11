// 第三方库类型声明

declare module 'composerize' {
  function composerize(command: string): string;
  export default composerize;
}

declare module 'decomposerize' {
  function decomposerize(yaml: string): string;
  export default decomposerize;
}
