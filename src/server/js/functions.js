/*
 * pwix:iziam-oidc/src/server/js/functions.js
 */

import _ from 'lodash';
import { generators, Issuer } from 'openid-client';

import { EnvSettings } from 'meteor/pwix:env-settings';
import { Logger } from 'meteor/pwix:logger';
import { Random } from 'meteor/random';
import { ServiceConfiguration } from 'meteor/service-configuration';

const logger = Logger.get();

iziamOIDC.s = {

    // set the iziamOIDC.s.client global server variable
    //  requires iziamOIDC.s.settings
    //  idempotent
    async _getClient( opts={} ){
        if( !iziamOIDC.s.client ){
            this._getIssuer();
            if( iziamOIDC.s.issuer ){
                const auth_method = opts.token_endpoint_auth_method || iziamOIDC.s.settings.token_endpoint_auth_method || 'client_secret_basic';
                const parms = {
                    client_id: opts.client_id || iziamOIDC.s.settings.client_id,
                    redirect_uris: [ opts.redirect_uri || iziamOIDC.s.settings.redirect_uri ],
                    response_types: [ 'code' ],
                    token_endpoint_auth_method: auth_method
                };
                if( auth_method !== 'none' ){
                    const secret = opts.client_secret || iziamOIDC.s.settings.client_secret;
                    if( !secret ){
                        throw new Error( 'client secret is not set though required by authentication method not being none' );
                    } else {
                        parms.client_secret = secret;
                    }
                }
                iziamOIDC.s.client = new iziamOIDC.s.issuer.Client( parms );
            }
        }
    },

    // set the iziamOIDC.s.issuer global server variable
    //  requires iziamOIDC.s.settings
    //  idempotent
    async _getIssuer(){
        if( !iziamOIDC.s.issuer ){
            this._getSettings();
            if( iziamOIDC.s.settings ){
                if( iziamOIDC.s.settings.issuerUrl ){
                    try {
                        iziamOIDC.s.issuer = await Issuer.discover( iziamOIDC.s.settings.issuerUrl );
                        if( iziamOIDC.s.issuer ){
                            logger.log( 'iziamOIDC._getIssuer() set iziamOIDC.s.issuer after successful '+iziamOIDC.C.Service+' discovery' );
                        }
                    }
                    catch( e ){
                        // may happen that the Issuer be temporarily unavailable - will have to retry later
                        logger.warn( e );
                    };
                } else {
                    logger.warn( 'iziamOIDC._getIssuer() unable to find \'issuerUrl\' data in \''+iziamOIDC.C.Service+'\' section from read private settings' );
                }
            }
        }
    },

    // setup the iziamOIDC.serviceConfiguration global server variable
    //  + make sure the ServiceConfiguraton Meteor collection ('meteor_accounts_loginServiceConfiguration') is up to date
    //  requires iziamOIDC.s.settings
    async _getServiceConfiguration(){
        this._getIssuer();
        if( iziamOIDC.s.issuer ){
            // remove the previous version
            await ServiceConfiguration.configurations.removeAsync({ service: iziamOIDC.C.Service });
            // make sure service configuration has last version from settings
            await ServiceConfiguration.configurations.upsertAsync({ service: iziamOIDC.C.Service }, { $set: {
                loginStyle: iziamOIDC.s.settings.loginStyle || 'popup',
                clientId: iziamOIDC.s.settings.client_id,
                clientSecret: iziamOIDC.s.settings.client_secret,
                serverUrl: iziamOIDC.s.settings.issuerUrl,
                resource: iziamOIDC.s.settings.resource,
                authorizationEndpoint: iziamOIDC.s.issuer.authorization_endpoint.substring( iziamOIDC.s.settings.issuerUrl.length ),
                tokenEndpoint: iziamOIDC.s.issuer.token_endpoint.substring( iziamOIDC.s.settings.issuerUrl.length ),
                userinfoEndpoint: iziamOIDC.s.issuer.userinfo_endpoint.substring( iziamOIDC.s.settings.issuerUrl.length ),
                idTokenWhitelistFields: [],
                redirect_uri: iziamOIDC.s.settings.redirect_uri,
                post_logout_redirect_uri: iziamOIDC.s.settings.post_logout_redirect_uri
            }});
            // and get back this new version of the config
            iziamOIDC.serviceConfiguration = await ServiceConfiguration.configurations.findOneAsync({ service: iziamOIDC.C.Service });
        }
    },

    // set the iziamOIDC.s.settings global server variable
    //  idempotent
    async _getSettings(){
        if( !iziamOIDC.s.settings ){
            const settings = await EnvSettings.s.environmentServerSettings();
            if( settings && settings.private ){
                if( settings.private[iziamOIDC.C.Service]  ){
                    logger.log( 'iziamOIDC._getSettings() set iziamOIDC.s.settings from private server settings per environment' );
                    iziamOIDC.s.settings = settings.private[iziamOIDC.C.Service];
                } else {
                    logger.warn( 'iziamOIDC._getSettings() unable to find \''+iziamOIDC.C.Service+'\' section in private settings' );
                }
            }
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
    async loginOptions( options ){
        //logger.debug( 'iziamOIDC.loginOptions()', options );
        const debugSettings = false;
        const debugIssuer = false;

        // make sure we have read the settings from the server and got an Issuer
        await this._getIssuer();
        await this._getServiceConfiguration();

        if( !iziamOIDC.s.issuer ){
            throw new Error( 'iziamOIDC.s.issuer has not been discovered' );
        }
        if( !iziamOIDC.serviceConfiguration ){
            throw new Error( 'iziamOIDC.serviceConfiguration has not been built' );
        }

        // iziamOIDC.s.settings are the settings read from the application 'private/config/server/environments.json'
        debugSettings && logger.debug( 'iziamOIDC.loginOptions() settings', iziamOIDC.s.settings );

        // iziamOIDC.Issuer is the metadata automatically discovered from the Issuer
        debugIssuer && logger.debug( 'iziamOIDC.loginOptions() Issuer', iziamOIDC.s.issuer );

        // build login options
        const result = {};
        result.config = iziamOIDC.serviceConfiguration;

        // needed here (server side) in order to be embedded in the 'state' parm in order to be able to close the modal later
        result.redirectUrl = options.redirect_uri || iziamOIDC.s.settings.redirect_uri;
        result.loginStyle = options.loginStyle || iziamOIDC.s.settings.loginStyle;
        result.popupOptions = options.popupOptions || iziamOIDC.s.settings.popupOptions;

        // Meteor.OAuth requires a credentialToken in the 'state'
        result.credentialToken = Random.secret();

        // store the code_verifier in the 'state' parameter which is brought back in the callback
        result.code_verifier = generators.codeVerifier();
        result.code_challenge = generators.codeChallenge( result.code_verifier );

        let scopes = ( options.scopes && options.scopes.length ) ? options.scopes : (( iziamOIDC.s.settings.scopes && iziamOIDC.s.settings.scopes.length ) ? iziamOIDC.s.settings.scopes : [] );
        if( !scopes.includes( 'openid' )){
            scopes.push( 'openid' );
        }

        let url = undefined;
        this._getClient( options );
        if( iziamOIDC.s.client ){
            url = iziamOIDC.s.client.authorizationUrl({
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
        await this._getClient();
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
