# icCube Dashboards Integration with Vue3

A working example for embedding an icCube Dashboards instance via an `iframe` or a `div` in Vue3.
Example uses `vite` `proxy` to set headers for icCube instance.

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure icCube for using authorization headers ([https://www.iccube.com/support/embedding-iccube-into-an-existing-web-application-authentication/](https://www.iccube.com/support/embedding-iccube-into-an-existing-web-application-authentication/))
   
    **_Authentication headers must be  `ic3_user_name` and `ic3_role_name`_**
4. Set your icCube instance URL and port at `vite.config.js`
5. In App.vue set your dashboard name (by default it `sers:/admin/demo`) 

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
