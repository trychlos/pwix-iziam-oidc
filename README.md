# pwix:core-ui

## What is it ?

A Meteor package which embeds our UI initializations.

This package:

- IS NOT THOUGHT TO BE PUBLISHED
- is expected to be added to an application (not required by a package), bringing with it most common dependencies.

It materializes our design decisions about user interface:

- deep copy, deep equal and other Object functions are handled by lodash, and check_npms takes care of requiring it
- it is Bootstrap-based, so check_npms takes care of requiring @popperjs/core and bootstrap
- embeds (and provides) latest FontAwesome copy
- requires pwix:layout package, so that is able to provide responsive layout utilities which adapt to the device
- provides the Page class to handle pages and routes in an organized way
- requires pwix:modal, pwix:tolert, pwix:bootbox for dialogs management

## Configuration

The package's behavior can be configured through a call to the `uiCore.configure()` method, with just a single javascript object argument, which itself should only contains the options you want override.

Known configuration options are:

- `verbosity`

    Define the expected verbosity level.

    The accepted value can be any or-ed combination of following:

    - `uiCore.C.Verbose.NONE`

        Do not display any trace log to the console

    - `uiCore.C.Verbose.CONFIGURE`

        Trace `uiCore.configure()` calls and their result

Please note that `uiCore.configure()` method should be called in the same terms both in client and server sides.

Remind too that Meteor packages are instanciated at application level. They are so only configurable once, or, in other words, only one instance has to be or can be configured. Addtionnal calls to `uiCore.configure()` will just override the previous one. You have been warned: **only the application should configure a package**.

## NPM peer dependencies

Starting with v 1.1.0, and in accordance with advices from [the Meteor Guide](https://guide.meteor.com/writing-atmosphere-packages.html#npm-dependencies), we no more hardcode NPM dependencies in the `Npm.depends` clause of the `package.js`. 

Instead we check npm versions of installed packages at runtime, on server startup, in development environment.

Dependencies as of v 0.1.0:
```
```

Each of these dependencies should be installed at application level:
```
    meteor npm install <package> --save
```

## Translations

New and updated translations are willingly accepted, and more than welcome. Just be kind enough to submit a PR on the [Github repository](https://github.com/trychlos/pwix-core-ui/pulls).

## Cookies and comparable technologies

`pwix:core-ui` may use `localStorage` to record ...

Because this is dynamically done on a per dialog basis, and only on the caller request, the package doesn't advertize of this use, relying on the caller own declaration.

---
P. Wieser
- Last updated on 2023, June 5th
