/*
 * pwix:iziam-oidc/src/server/js/functions.js
 */

import _ from 'lodash';
import * as client from 'openid-client';
import { url } from 'node:url';

import { EnvSettings } from 'meteor/pwix:env-settings';
import { Logger } from 'meteor/pwix:logger';
import { Random } from 'meteor/random';
import { ServiceConfiguration } from 'meteor/service-configuration';

const logger = Logger.get();

iziamOIDC.s = {

    // set the iziamOIDC.s.settings global server variable: the private 'iziam' app settings for the environment
    //  idempotent
    async _getSettings(){
        if( !iziamOIDC.s.settings ){
            const settings = await EnvSettings.s.environmentServerSettings();
            if( settings?.settings?.private ){
                if( settings.settings.private[iziamOIDC.C.Service]  ){
                    logger.log( 'iziamOIDC.s._getSettings() set iziamOIDC.s.settings from private server settings per environment' );
                    iziamOIDC.s.settings = settings.settings.private[iziamOIDC.C.Service];
                } else {
                    logger.warn( 'iziamOIDC.s._getSettings() sectioon \''+iziamOIDC.C.Service+'\' not found in private settings' );
                }
            }
        }
    },

    // set the iziamOIDC.s.client global server variable: the client Configuration
    //  the passed-in 'parms' parameter is the current state of the built parameters
    //  includes notably config, code_verifier and so on
    //  idempotent
    async _initClientConfig( parms ){
        if( !iziamOIDC.s.client ){
            iziamOIDC.s.client = await client.discovery( new URL( parms.config.issuerUrl ), parms.config.client_id, parms.config.client_secret );
        }
    },

    // setup the iziamOIDC.serviceConfiguration global server variable: the login service 'iziam' configuration
    //  + make sure the ServiceConfiguraton Meteor collection ('meteor_accounts_loginServiceConfiguration') is up to date
    //  requires iziamOIDC.s.settings
    async _initServiceConfiguration(){
        await this._getSettings();
        logger.debug( 'iziamOIDC.s._initServiceConfiguration() settings', iziamOIDC.s.settings );
        if( iziamOIDC.s.settings ){
            // remove the previous version
            await ServiceConfiguration.configurations.removeAsync({ service: iziamOIDC.C.Service });
            // make sure service configuration has last version from settings
            await ServiceConfiguration.configurations.upsertAsync({ service: iziamOIDC.C.Service }, { $set: iziamOIDC.s.settings });
            // and get back this new version of the config
            iziamOIDC.s.serviceConfiguration = await ServiceConfiguration.configurations.findOneAsync({ service: iziamOIDC.C.Service });
        }
    },

    // decode the 'state' parm, returning the original object
    _stateDecode( state ){
        return JSON.parse( Buffer.from( state, 'base64' ).toString( 'ascii' ));
    },

    // encode in the 'state' parm the data we need to have in the redirection code
    //  we set:
    //  - code_verifier
    //  - redirection url
    _stateEncode( options ){
        const o = {
            loginStyle: options.loginStyle,
            verifier: options.code_verifier,
            redirect: options.redirectUrl,
            credentialToken: options.credentialToken
        }
        return Buffer.from( JSON.stringify( o )).toString( 'base64' );
    },

    // Call the iziamOIDC change_password interaction URL for the current identity
    async changeOptions( options={}, userId ){
        // make sure we have read the settings from the server and got an Issuer
        await this._getIssuer();
        await this._getClient();

        // build login options
        const result = {};

        // needed here (server side) in order to be embedded in the 'state' parm in order to be able to close the modal later
        result.redirectUrl = options.redirect_uri || iziamOIDC.s.settings.redirect_uri;
        result.loginStyle = options.loginStyle || iziamOIDC.s.settings.loginStyle;
        result.popupOptions = options.popupOptions || iziamOIDC.s.settings.popupOptions;

        // Meteor.OAuth requires a credentialToken in the 'state'
        result.credentialToken = Random.secret();

        // store the code_verifier in the 'state' parameter which is brought back in the callback
        result.code_verifier = generators.codeVerifier();
        result.code_challenge = generators.codeChallenge( result.code_verifier );

        let url = undefined;
        this._getClient( options );
        if( iziamOIDC.s.client ){
            url = iziamOIDC.s.client.authorizationUrl({
                scope: 'openid',
                prompt: 'change_password',
                code_challenge: result.code_challenge,
                code_challenge_method: 'S256',
                state: iziamOIDC.s._stateEncode( result )
            });
        }
        //logger.debug( 'iziamOIDC.changeOptions()', url );
        result.url = url;

        return result;
    },

    // Prepare the needed options for login flow
    //  this is called as a method from the client requestCredential() function
    // @param {Object} options: an optional options object passed from 'iziamLoginButton' component through its 'iziamOptions' component parameter
    //  it superseded the ServiceConfiguration initialized from the app settings

    async loginOptions( options ){
        //logger.debug( 'iziamOIDC.s.oginOptions()', options );
        const debugSettings = false;

        // read settings, and initialize the ServiceConfiguration service
        await this._initServiceConfiguration();
        if( !iziamOIDC.s.serviceConfiguration ){
            throw new Error( 'iziamOIDC.s.serviceConfiguration has not been initialized' );
        }

        // build login options to be returned to be passed to OAuth.launchLogin()
        const result = {};
        result.config = { ...iziamOIDC.s.serviceConfiguration };

        // see https://docs.meteor.com/api/accounts.html#popup-vs-redirect-flow
        //  - loginStyle should default to 'popup' in MeteorJS applications (this is expected to be set in app settings)
        //  - loginStyle should be rather 'redirect' in mobile apps using UIWebViews - This is why loginWithIziam is passwed with a 'mobileHint'
        if( options.mobileHint ){
            options.loginStyle = 'redirect';
        }

        // needed here (server side) in order to be embedded in the 'state' parm in order to be able to close the modal later
        result.loginStyle = options.loginStyle || iziamOIDC.s.serviceConfiguration.loginStyle; // in state
        result.popupOptions = options.popupOptions || iziamOIDC.s.serviceConfiguration.popupOptions;
        result.redirectUrl = options.redirect_uri || iziamOIDC.s.serviceConfiguration.redirect_uri; // in state

        // Meteor.OAuth requires a credentialToken in the 'state'
        result.credentialToken = Random.secret( 32 );

        // store the code_verifier in the 'state' parameter which is brought back in the callback
        result.code_verifier = client.randomPKCECodeVerifier(); // in state
        result.code_challenge = await client.calculatePKCECodeChallenge( result.code_verifier );

        let scopes = ( options.scopes && options.scopes.length ) ? options.scopes : (( iziamOIDC.s.settings.scopes && iziamOIDC.s.settings.scopes.length ) ? iziamOIDC.s.settings.scopes : [] );
        if( !scopes.includes( 'openid' )){
            scopes.push( 'openid' );
        }

        let url = undefined;
        await this._initClientConfig( result );
        if( iziamOIDC.s.client ){
            url = client.buildAuthorizationUrl( iziamOIDC.s.client, {
                scope: scopes.join( ' ' ),
                resource: iziamOIDC.s.settings.resources,
                code_challenge: result.code_challenge,
                code_challenge_method: 'S256',
                state: iziamOIDC.s._stateEncode( result )
            });
        }
        //logger.debug( 'iziamOIDC.loginOptions()', url );
        result.url = url;

        return result;
    },

    // logout and terminate the user session
    //  arguments are built on the server, but logout url is actually fetched from the client to be able to provide session cookies
    async logoutOptions(){
        let args = {};
        await this._initClientConfig();
        if( iziamOIDC.s.tokenSet ){
            args.id_token_hint = iziamOIDC.s.tokenSet.id_token;  // Retrieve the ID Token from the session
        }
        if( iziamOIDC.s.settings?.post_logout_redirect_uri ){
            args.post_logout_redirect_uri = iziamOIDC.s.settings.post_logout_redirect_uri;
        }
        const endSessionUrl = iziamOIDC.s.client ? iziamOIDC.s.client.endSessionUrl( args ) : null;
        return endSessionUrl ? { url: endSessionUrl } : null;
    }
};
