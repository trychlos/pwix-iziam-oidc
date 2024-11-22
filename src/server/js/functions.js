/*
 * pwix:iziam-oidc/src/server/js/functions.js
 */

import _ from 'lodash';
import { generators, Issuer } from 'openid-client';

import { EnvSettings } from 'meteor/pwix:env-settings';
import { Random } from 'meteor/random';
import { ServiceConfiguration } from 'meteor/service-configuration';

izIAM.s = {

    // set the izIAM.s.client global server variable
    //  requires izIAM.s.settings
    //  idempotent
    async _getClient( opts={} ){
        if( !izIAM.s.client ){
            this._getIssuer();
            if( izIAM.s.issuer ){
                const auth_method = opts.token_endpoint_auth_method || izIAM.s.settings.token_endpoint_auth_method || 'client_secret_basic';
                const parms = {
                    client_id: opts.client_id || izIAM.s.settings.client_id,
                    redirect_uris: [ opts.redirect_uri || izIAM.s.settings.redirect_uri ],
                    response_types: [ 'code' ],
                    token_endpoint_auth_method: auth_method
                };
                if( auth_method !== 'none' ){
                    const secret = opts.client_secret || izIAM.s.settings.client_secret;
                    if( !secret ){
                        throw new Error( 'client secret is not set though required by authentication method not being none' );
                    } else {
                        parms.client_secret = secret;
                    }
                }
                izIAM.s.client = new izIAM.s.issuer.Client( parms );
            }
        }
    },

    // set the izIAM.s.issuer global server variable
    //  requires izIAM.s.settings
    //  idempotent
    async _getIssuer(){
        if( !izIAM.s.issuer ){
            this._getSettings();
            if( izIAM.s.settings ){
                if( izIAM.s.settings.issuerUrl ){
                    try {
                        izIAM.s.issuer = await Issuer.discover( izIAM.s.settings.issuerUrl );
                        if( izIAM.s.issuer ){
                            console.debug( 'set izIAM.s.issuer after successful '+izIAM.C.Service+' discovery' );
                        }
                    }
                    catch( e ){
                        // may happen that the Issuer be temporarily unavailable - will have to retry later
                        console.warn( e );
                    };
                } else {
                    console.warn( 'unable to find \'issuerUrl\' data in \''+izIAM.C.Service+'\' section from read private settings' );
                }
            }
        }
    },

    // setup the izIAM.serviceConfiguration global server variable
    //  + make sure the ServiceConfiguraton Meteor collection ('meteor_accounts_loginServiceConfiguration') is up to date
    //  requires izIAM.s.settings
    async _getServiceConfiguration(){
        this._getIssuer();
        if( izIAM.s.issuer ){
            // remove the previous version
            await ServiceConfiguration.configurations.removeAsync({ service: izIAM.C.Service });
            // make sure service configuration has last version from settings
            await ServiceConfiguration.configurations.upsertAsync({ service: izIAM.C.Service }, { $set: {
                loginStyle: izIAM.s.settings.loginStyle || 'popup',
                clientId: izIAM.s.settings.client_id,
                clientSecret: izIAM.s.settings.client_secret,
                serverUrl: izIAM.s.settings.issuerUrl,
                resource: izIAM.s.settings.resource,
                authorizationEndpoint: izIAM.s.issuer.authorization_endpoint.substring( izIAM.s.settings.issuerUrl.length ),
                tokenEndpoint: izIAM.s.issuer.token_endpoint.substring( izIAM.s.settings.issuerUrl.length ),
                userinfoEndpoint: izIAM.s.issuer.userinfo_endpoint.substring( izIAM.s.settings.issuerUrl.length ),
                idTokenWhitelistFields: [],
                redirect_uri: izIAM.s.settings.redirect_uri,
                post_logout_redirect_uri: izIAM.s.settings.post_logout_redirect_uri
            }});
            // and get back this new version of the config
            izIAM.serviceConfiguration = await ServiceConfiguration.configurations.findOneAsync({ service: izIAM.C.Service });
        }
    },

    // set the izIAM.s.settings global server variable
    //  idempotent
    async _getSettings(){
        if( !izIAM.s.settings ){
            const settings = EnvSettings.environmentServerSettings();
            if( settings && settings.private ){
                if( settings.private[izIAM.C.Service]  ){
                    console.debug( 'set izIAM.s.settings from private server settings per environment' );
                    izIAM.s.settings = settings.private[izIAM.C.Service];
                } else {
                    console.warn( 'unable to find \''+izIAM.C.Service+'\' section in private settings' );
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

    // Call the izIAM change_password interaction URL for the current identity
    async changeOptions( options={}, userId ){
        // make sure we have read the settings from the server and got an Issuer
        await this._getIssuer();
        await this._getClient();

        // build login options
        const result = {};

        // needed here (server side) in order to be embedded in the 'state' parm in order to be able to close the modal later
        result.redirectUrl = options.redirect_uri || izIAM.s.settings.redirect_uri;
        result.loginStyle = options.loginStyle || izIAM.s.settings.loginStyle;
        result.popupOptions = options.popupOptions || izIAM.s.settings.popupOptions;

        // Meteor.OAuth requires a credentialToken in the 'state'
        result.credentialToken = Random.secret();

        // store the code_verifier in the 'state' parameter which is brought back in the callback
        result.code_verifier = generators.codeVerifier();
        result.code_challenge = generators.codeChallenge( result.code_verifier );

        let url = undefined;
        this._getClient( options );
        if( izIAM.s.client ){
            url = izIAM.s.client.authorizationUrl({
                scope: 'openid',
                prompt: 'change_password',
                code_challenge: result.code_challenge,
                code_challenge_method: 'S256',
                state: izIAM.s._stateEncode( result )
            });
        }
        //console.debug( 'url', url );
        result.url = url;

        return result;
    },

    // Prepare the needed options for login flow
    //  this is called as a method from the client requestCredential() function
    // @param {Object} options: an optional options object passed from 'iziamLoginButton' component through its 'iziamOptions' component parameter
    async loginOptions( options ){
        //console.debug( 'loginOptions', options );
        const debugSettings = false;
        const debugIssuer = false;

        // make sure we have read the settings from the server and got an Issuer
        await this._getIssuer();
        await this._getServiceConfiguration();

        if( !izIAM.s.issuer ){
            throw new Error( 'izIAM.s.issuer has not been discovered' );
        }
        if( !izIAM.serviceConfiguration ){
            throw new Error( 'izIAM.serviceConfiguration has not been built' );
        }

        // izIAM.s.settings are the settings read from the application 'private/config/server/environments.json'
        debugSettings && console.debug( 'settings', izIAM.s.settings );

        // izIAM.Issuer is the metadata automatically discovered from the Issuer
        debugIssuer && console.debug( 'Issuer', izIAM.s.issuer );

        // build login options
        const result = {};
        result.config = izIAM.serviceConfiguration;

        // needed here (server side) in order to be embedded in the 'state' parm in order to be able to close the modal later
        result.redirectUrl = options.redirect_uri || izIAM.s.settings.redirect_uri;
        result.loginStyle = options.loginStyle || izIAM.s.settings.loginStyle;
        result.popupOptions = options.popupOptions || izIAM.s.settings.popupOptions;

        // Meteor.OAuth requires a credentialToken in the 'state'
        result.credentialToken = Random.secret();

        // store the code_verifier in the 'state' parameter which is brought back in the callback
        result.code_verifier = generators.codeVerifier();
        result.code_challenge = generators.codeChallenge( result.code_verifier );

        let scopes = ( options.scopes && options.scopes.length ) ? options.scopes : (( izIAM.s.settings.scopes && izIAM.s.settings.scopes.length ) ? izIAM.s.settings.scopes : [] );
        if( !scopes.includes( 'openid' )){
            scopes.push( 'openid' );
        }

        let url = undefined;
        this._getClient( options );
        if( izIAM.s.client ){
            url = izIAM.s.client.authorizationUrl({
                scope: scopes.join( ' ' ),
                resource: izIAM.s.settings.resources,
                code_challenge: result.code_challenge,
                code_challenge_method: 'S256',
                state: izIAM.s._stateEncode( result )
            });
        }
        //console.debug( 'url', url );
        result.url = url;

        return result;
    },

    // logout and terminate the user session
    //  arguments are built on the server, but logout url is actually fetched from the client to be able to provide session cookies
    async logoutOptions(){
        let args = {};
        await this._getClient();
        if( izIAM.s.tokenSet ){
            args.id_token_hint = izIAM.s.tokenSet.id_token;  // Retrieve the ID Token from the session
        }
        if( izIAM.s.settings?.post_logout_redirect_uri ){
            args.post_logout_redirect_uri = izIAM.s.settings.post_logout_redirect_uri;
        }
        const endSessionUrl = izIAM.s.client ? izIAM.s.client.endSessionUrl( args ) : null;
        return endSessionUrl ? { url: endSessionUrl } : null;
    }
};
