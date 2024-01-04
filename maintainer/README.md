# pwix:iziam-oidc / maintainer

## Login flow

### Application

- must be declared as a Relying Party (RP) client in the OIDC Provider

    It is so issued with a client identifier and secret

- must `meteor add pwix:accounts-iziam` package

    which itself will use (and imply) `pwix:iziam-oidc` package

- must include and stylish `iziamLoginButton` component.

### At initialization time

```
 package                client                                                      server
 ---------------------  ----------------------------------------------------------  ----------------------------------------------------------
 accounts-iziam         call Accounts.oauth.registerService( izIAM.C.Service );     call Accounts.oauth.registerService( izIAM.C.Service );
 accounts-iziam         define Meteor.loginWithIzIAM() function                     call Accounts.addAutopublishFields({...});
 iziam-oidc                                                                         call OAuth.registerService( izIAM.C.Service )
```

### At startup time

```
 package                client                                                      server
 --------------------   ----------------------------------------------------------  ----------------------------------------------------------
 iziam-oidc                                                                         load service configuration from server settings
 iziam-oidc                                                                         set izIAM.Issuer after successful service discovery
```

### When the user cliks on `login with izIAM`

```
 package                            client                                                      server
 --------------------------------   ----------------------------------------------------------  ----------------------------------------------------------
 accounts-iziam:click'              call to Meteor.loginWithIzIAM()
 accounts-iziam:loginWithIzIAM()    call izIAM.requestCredential()
 iziam-oidc:requestCredential()     call 'prepareLogin' method
 iziam-oidc:prepareLogin                                                                        build and return loginOptions for OIDC Provider (OP)
 iziam-oidc:requestCredential()     call OAuth.launchLogin( loginOptions )
```

- `iziamLoginButton` event handler calls ``

- `accounts-iziam:loginWithIzIAM()`