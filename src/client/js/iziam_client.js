/*
 * pwix:iziam-oidc/src/client/js/iziam_client.js
 */

import { OAuth } from 'meteor/oauth';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { Tracker } from 'meteor/tracker';

// Request izIAM credentials for the user
// @param options {optional}
//  - loginStyle, 'popup' or 'redirect', defaulting to the ServiceConfiguration value (which itself has been read from settings per environment)
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
// Note: the requestCredential() function is called by accounts-iziam, and is not expected to return something.
izIAM.requestCredential = async ( options, credentialRequestCompleteCallback ) => {
    //console.debug( 'entering izIAM.requestCredential() with options', options );

    // support both (options, callback) and (callback).
    if( !credentialRequestCompleteCallback && typeof options === 'function' ){
        credentialRequestCompleteCallback = options;
        options = {};
    }

    // make sure options is a plain object
    options = options || {};

    Meteor.callAsync( 'iziam.prepareLogin', options )
        .then(( loginOptions ) => {
            if( !loginOptions ){
                credentialRequestCompleteCallback && credentialRequestCompleteCallback( new ServiceConfiguration.ConfigError());
                return;
            }
            console.debug( 'calling OAuth.launchLogin() with loginOptions', loginOptions );
            OAuth.launchLogin({
                loginService: izIAM.C.Service,
                loginStyle: loginOptions.loginStyle,
                loginUrl: loginOptions.url,
                credentialToken: loginOptions.credentialToken,
                credentialRequestCompleteCallback,
                popupOptions: { width: 900, height: 450 }
            });
        });
};

// detect the user logout and end the OIDC session
// have to fetch the end_session url from the client to have the session cookies
let prev = Meteor.userId();
Tracker.autorun(() => {
    if( prev && !Meteor.userId()){
        Meteor.callAsync( 'iziam.logout_args' ).then(( res ) => {
            fetch( res.url, {
                method: 'GET',
                cache: 'no-cache',
                mode: 'no-cors',
                credentials: 'include'
            }).then(() => {
                window.location.pathname = '/';
            });
        })
    }
    prev = Meteor.userId();
});
