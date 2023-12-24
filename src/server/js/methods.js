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

import { ServiceConfiguration } from 'meteor/service-configuration';

Meteor.methods({
    'register.getConfig'(){
        let config = ServiceConfiguration.configurations.findOne({ service: izIAM.C.Service });
        if( !config ){
            const set = {
                loginStyle: izIAM.settings.loginStyle || 'popup',
                clientId: izIAM.settings.clientId,
                secret: izIAM.settings.clientSecret,
                serverUrl: izIAM.settings.rootUrl,
                authorizationEndpoint: izIAM.Issuer.authorization_endpoint.substring( izIAM.settings.rootUrl.length ),
                tokenEndpoint: izIAM.Issuer.token_endpoint.substring( izIAM.settings.rootUrl.length ),
                userinfoEndpoint: izIAM.Issuer.userinfo_endpoint.substring( izIAM.settings.rootUrl.length ),
                idTokenWhitelistFields: []
            };
            console.debug( 'register.service set', set );
            ServiceConfiguration.configurations.upsert({ service: izIAM.C.Service }, { $set: set });
            config = ServiceConfiguration.configurations.findOne({ service: izIAM.C.Service });
        }
        console.debug( 'config', config );
        return config;
    }
});
