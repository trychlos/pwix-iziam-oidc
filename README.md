# pwix:iziam-oidc

## What is it ?

A Meteor package which manages the OIDC connection against izIAM Identity and Access Manager.

This package is expected to be implemented by any application which would take advantage of izIAM authentication features.

## Provides

### `iziamOIDC`

A global object which holds all the needed resources.

## Configuration

The package's behavior can be configured through a call to the `iziamOIDC.configure()` method, with just a single javascript object argument, which itself should only contains the options you want override.

Known configuration options are:

- `verbosity`

    Define the expected verbosity level.

    The accepted value can be any or-ed combination of following:

    - `iziamOIDC.C.Verbose.NONE`

        Do not display any trace log to the console

    - `iziamOIDC.C.Verbose.CONFIGURE`

        Trace `iziamOIDC.configure()` calls and their result

Please note that `iziamOIDC.configure()` method should be called in the same terms both in client and server sides.

Remind too that Meteor packages are instanciated at application level. They are so only configurable once, or, in other words, only one instance has to be or can be configured. Addtionnal calls to `iziamOIDC.configure()` will just override the previous one. You have been warned: **only the application should configure a package**.

## NPM peer dependencies

Starting with v 1.0.0, and in accordance with advices from [the Meteor Guide](https://guide.meteor.com/writing-atmosphere-packages.html#npm-dependencies), we no more hardcode NPM dependencies in the `Npm.depends` clause of the `package.js`. 

Instead we check npm versions of installed packages at runtime, on server startup, in development environment.

Dependencies as of v 1.0.0:
```
    'lodash': '^4.17.0',
    'openid-client': '^5.6.1'
```

Each of these dependencies should be installed at application level:
```
    meteor npm install <package> --save
```

## Translations

None at the moment.

## Cookies and comparable technologies

None at the moment.

---
P. Wieser
- Last updated on 2024, Nov. 29th
