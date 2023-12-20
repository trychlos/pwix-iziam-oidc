# pwix:iziam

## What is it ?

A Meteor package which manages the OIDC connection against izIAM Identity Manager.

## NPM peer dependencies

Starting with v 1.0.0, and in accordance with advices from [the Meteor Guide](https://guide.meteor.com/writing-atmosphere-packages.html#npm-dependencies), we no more hardcode NPM dependencies in the `Npm.depends` clause of the `package.js`. 

Instead we check npm versions of installed packages at runtime, on server startup, in development environment.

Dependencies as of v 1.0.0:
```
    '@popperjs/core': '^2.11.6',
    'bootstrap': '^5.2.1',
    'lodash': '^4.17.0'
```

Each of these dependencies should be installed at application level:
```
    meteor npm install <package> --save
```

## Translations

New and updated translations are willingly accepted, and more than welcome. Just be kind enough to submit a PR on the [Github repository](https://github.com/trychlos/pwix-iziam/pulls).

## Cookies and comparable technologies

`pwix:iziam` may use `localStorage` to record ...

Because this is dynamically done on a per dialog basis, and only on the caller request, the package doesn't advertize of this use, relying on the caller own declaration.

---
P. Wieser
- Last updated on 2023, June 5th
