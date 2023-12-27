/*
 * pwix:iziam-oidc/src/client/js/iziam_client.js
 */

//import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { OAuth } from 'meteor/oauth';
import { ServiceConfiguration } from 'meteor/service-configuration';

// Request izIAM credentials for the user
// @param options {optional}
//  - loginStyle, 'popup' or 'redirect', defaulting to the ServiceConfiguration value (which itself is read from settings per environment)
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
// Note: the requestCredential() function is called by accounts-iziam, and is not expected to return something.
//  May be async.
izIAM.requestCredential = ( options, credentialRequestCompleteCallback ) => {
    console.debug( 'izIAM.requestCredential', 'options', options, 'credentialRequestCompleteCallback', credentialRequestCompleteCallback );

    // support both (options, callback) and (callback).
    if( !credentialRequestCompleteCallback && typeof options === 'function' ){
        credentialRequestCompleteCallback = options;
        options = {};
    }

    // make sure options is not null
    options = options || {};

    Meteor.callPromise( 'iziam.prepareLogin', options )
        .then(( loginOptions ) => {
            console.debug( 'loginOptions', loginOptions );
            if( !loginOptions ){
                credentialRequestCompleteCallback && credentialRequestCompleteCallback( new ServiceConfiguration.ConfigError());
                return;
            }

            const loginStyle = options.loginStyle || loginOptions.config.loginStyle;
            const url = loginOptions.url; // + `&state=${OAuth._stateParam( loginStyle, loginOptions.code_challenge, options && options.redirectUrl )}`;
            //const url = loginOptions.url + `&state=${OAuth._stateParam( loginOptions.code_verifier )}`;

            OAuth.launchLogin({
                loginService: izIAM.C.Service,
                loginStyle: loginStyle,
                loginUrl: url,
                //credentialToken: loginOptions.code_challenge,
                credentialRequestCompleteCallback,
                popupOptions: { width: 900, height: 450 }
            });
        });
};

// the redirect_uri route
/*
FlowRouter.route( '/cb', {
    action(){
        console.log( '/cb', FlowRouter.current());
    },
});
*/
