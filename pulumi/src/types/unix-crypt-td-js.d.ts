declare module "unix-crypt-td-js" {
    const crypt3: (password: string, salt: string) => string
    export default crypt3

}
