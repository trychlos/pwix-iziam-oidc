/*
 * pwix:iziam-oidc/src/common/js/global.js
 */

izIAM = {
    // server (autorun) settings read from server settings per environment
    settings: null,
    // server (autorun) set after successful OpenID Issuer discovery
    Issuer: null,
    // server (function.prepareLogin)
    serviceConfiguration: null,
    client: null,
};
