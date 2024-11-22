/*
 * pwix:iziam-oidc/src/server/js/methods.js
 */

Meteor.methods({
    async 'iziam.changeOptions'(){
        return await izIAM.s.changeOptions( this.userId );
    },
    async 'iziam.loginOptions'( options ){
        return await izIAM.s.loginOptions( options );
    },
    async 'iziam.logoutOptions'(){
        return await izIAM.s.logoutOptions();
    },
});
