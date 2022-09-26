// https://angular.io/styleguide#!#04-12
export function throwDuplicatedInstance(superModule: any, moduleName: string) {
  if (superModule) {
    throw new Error(
      `${moduleName} is loaded. Application only allows one instance running`
    );
  }
}
