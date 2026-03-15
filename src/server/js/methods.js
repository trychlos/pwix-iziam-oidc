/*
 * pwix:iziam-oidc/src/server/js/methods.js
 */

Meteor.methods({
    async 'pwix.iziamOIDC.m.accessToken'(){
        return await iziamOIDC.s.tokenSet?.access_token;
    },
    async 'pwix.iziamOIDC.m.changeOptions'(){
        return await iziamOIDC.s.changeOptions( this.userId );
    },
    async 'pwix.iziamOIDC.m.loginOptions'( options ){
        return await iziamOIDC.s.loginOptions( options );
    },
    async 'pwix.iziamOIDC.m.logoutOptions'(){
        return await iziamOIDC.s.logoutOptions();
    },
});
