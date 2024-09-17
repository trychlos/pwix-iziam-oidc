/*
 * pwix:iziam-oidc/src/server/js/methods.js
 *
 * Rationale:
 *  According to all found documentations, ServiceConfiguration.configurations.upsert() function should be called at startup time, after having
 *  read settings. But our settings are 'per environment' and are only available after pwix:env-settings package has read them. So our code runs
 *  inside an autorun in order to discover the issuer.
 *  Unfortunately, ServiceConfiguration.configurations.upsert() cannot be run inside of an autorun as fibers is missing. So we wait for the first
 *  izIAM.requestCredential() call to run this method.
 * 
 * Please note that data to be registered are available either from the settings or from the issuer, so server-side only.
 */

Meteor.methods({
    async 'iziam.prepareLogin'( options ){
        return await izIAM.s.prepareLogin( options );
    }
});
