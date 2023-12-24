/*
 * pwix:iziam-oidc/src/client/js/iziam_client.js
 */

import { OAuth } from 'meteor/oauth';
import { Random } from 'meteor/random';
import { ServiceConfiguration } from 'meteor/service-configuration';

// Request izIAM credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
// Note: the requestCedential() function is called by accounts-iziam, and is not expected to return something.
//  May be async.
izIAM.requestCredential = ( options, credentialRequestCompleteCallback ) => {
    console.debug( 'izIAM.requestCredential', options );

    // support both (options, callback) and (callback).
    if( !credentialRequestCompleteCallback && typeof options === 'function' ){
        credentialRequestCompleteCallback = options;
        options = {};
    }

    Meteor.callPromise( 'register.getConfig' )
        .then(( config ) => {
            console.debug( 'config', config );
            if( !config ){
                credentialRequestCompleteCallback && credentialRequestCompleteCallback( new ServiceConfiguration.ConfigError());
                return;
            }

            const credentialToken = Random.secret();
            const scope = ( options && options.requestPermissions ) || ['user:email'];
            const flatScope = scope.map( encodeURIComponent ).join( '+' );
            const loginStyle = OAuth._loginStyle( izIAM.C.Service, config, options );

            let allowSignup = '';
            if( Accounts._options?.forbidClientAccountCreation ){
                allowSignup = '&allow_signup=false'; // https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#parameters
            }

            const loginUrl =
                'https://iziam.com/login/oauth/authorize' +
                `?client_id=${config.clientId}` +
                `&scope=${flatScope}` +
                `&redirect_uri=${OAuth._redirectUri( izIAM.C.Service, config)}` +
                `&state=${OAuth._stateParam(loginStyle, credentialToken, options && options.redirectUrl)}` +
                allowSignup;

            OAuth.launchLogin({
                loginService: izIAM.C.Service,
                loginStyle,
                loginUrl,
                credentialRequestCompleteCallback,
                credentialToken,
                popupOptions: {width: 900, height: 450}
            });
        });
};
