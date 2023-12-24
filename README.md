# pwix:iziam-oidc
# pwix:iziam-oidc

## What is it ?

A Meteor package which manages the OIDC connection against izIAM Identity Manager.

## Configuration

The package's behavior can be configured through a call to the `izIAM.configure()` method, with just a single javascript object argument, which itself should only contains the options you want override.

Known configuration options are:

- `verbosity`

    Define the expected verbosity level.

    The accepted value can be any or-ed combination of following:

    - `izIAM.C.Verbose.NONE`

        Do not display any trace log to the console

    - `izIAM.C.Verbose.CONFIGURE`

        Trace `izIAM.configure()` calls and their result

Please note that `izIAM.configure()` method should be called in the same terms both in client and server sides.

Remind too that Meteor packages are instanciated at application level. They are so only configurable once, or, in other words, only one instance has to be or can be configured. Addtionnal calls to `izIAM.configure()` will just override the previous one. You have been warned: **only the application should configure a package**.

## Functions

### `izIAM.discover( [url] )`

Discover the issuer available as the specified URL, defaulting to izIAM._defaults.oid_dicovery = `http://localhost:3000`.

Server-side function.

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

`pwix:iziam-oidc` may use `localStorage` to record ...
`pwix:iziam-oidc` may use `localStorage` to record ...

Because this is dynamically done on a per dialog basis, and only on the caller request, the package doesn't advertize of this use, relying on the caller own declaration.

---
P. Wieser
- Last updated on 2023, June 5th
