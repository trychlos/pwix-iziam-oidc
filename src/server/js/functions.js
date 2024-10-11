/*
 * pwix:iziam-oidc/src/server/js/functions.js
 */

import _ from 'lodash';
import { generators, Issuer } from 'openid-client';

import { EnvSettings } from 'meteor/pwix:env-settings';
import { Random } from 'meteor/random';
import { ServiceConfiguration } from 'meteor/service-configuration';

izIAM.s = {
    // make sure that provided scopes are single-spaces separated and appear only once
    //  @param {String|Array<String>} a list of scopes
    //  @param {String} a string of each scope appears only once
    checkScopes( a ){
        const b = _.isArray( a ) ? a : [ a ];   // be sure to have an array of strings
        let c = {};
        ( b || [] ).forEach(( d ) => {            // explore array
            const e = d.split( /\s+/ );           // be sure to have an array of single words
            ( e || [] ).forEach(( f ) => {        // and for each word...
                c[f] = true;
            });
        });
        return Object.keys( c ).join( ' ' );
    },

    // return the config as read from settings and systematically set in ServiceConfiguration collection
    //  making sure to work with last version
    async getConfig(){
        let config;
        const debug = false;
        await ServiceConfiguration.configurations.removeAsync({ service: izIAM.C.Service })
            .then(( res ) => {
                debug && console.debug( 'removeAsync', res );
                const set = {
                    loginStyle: izIAM.settings.loginStyle || 'popup',
                    clientId: izIAM.settings.client_id,
                    clientSecret: izIAM.settings.client_secret,
                    serverUrl: izIAM.settings.issuerUrl,
                    resource: izIAM.settings.resource,
                    authorizationEndpoint: izIAM.Issuer.authorization_endpoint.substring( izIAM.settings.issuerUrl.length ),
                    tokenEndpoint: izIAM.Issuer.token_endpoint.substring( izIAM.settings.issuerUrl.length ),
                    userinfoEndpoint: izIAM.Issuer.userinfo_endpoint.substring( izIAM.settings.issuerUrl.length ),
                    idTokenWhitelistFields: [],
                    redirect_uri: izIAM.settings.redirect_uri
                };
                return ServiceConfiguration.configurations.upsertAsync({ service: izIAM.C.Service }, { $set: set });
            })
            .then(( res ) => {
                debug && console.debug( 'upsertAsync', res );
                return ServiceConfiguration.configurations.findOneAsync({ service: izIAM.C.Service });
            })
            .then(( res ) => {
                config = res;
                debug && console.debug( 'findOneAsync', config );
            });
        return config;
    },

    // Prepare the needed options
    //  taking advantage of being server side to have openid-client resources
    //  this is called as a method from the client requestCredential() function
    //
    // @param {Object} options: an optional options object passed from 'iziamLoginButton' component through its 'iziamOptions' component parameter
    async prepareLogin( options ){

        const debugSettings = false;
        const debugIssuer = false;

        // make sure we have read the settings from the server and got an Issuer
        await izIAM.s.tryDiscover();
        const serviceConfiguration = await izIAM.s.getConfig();

        if( !izIAM.settings ){
            throw new Error( 'izIAM settings are not available' );
        }
        if( !izIAM.Issuer ){
            throw new Error( 'Issuer has not been discovered' );
        }

        // izIAM.settings are the settings read from the application 'private/config/server/environments.json'
        debugSettings && console.debug( 'settings', izIAM.settings );

        // izIAM.Issuer is the metadata automatically discovered from the Issuer
        debugIssuer && console.debug( 'Issuer', izIAM.Issuer );

        // build login options
        const loginOptions = {};
        loginOptions.config = serviceConfiguration;

        // needed here (server side) in order to be embedded in the 'state' parm in order to be able to close the modal later
        loginOptions.redirectUrl = options.redirect_uri || izIAM.settings.redirect_uri;
        loginOptions.loginStyle = options.loginStyle || izIAM.settings.loginStyle;
        loginOptions.popupOptions = options.popupOptions || izIAM.settings.popupOptions;

        // Meteor.OAuth requires a credentialToken in the 'state'
        loginOptions.credentialToken = Random.secret();

        // prepare the client-side OID client
        const auth_method = options.token_endpoint_auth_method || izIAM.settings.token_endpoint_auth_method || 'client_secret_basic';
        const clientParms = {
            client_id: options.client_id || izIAM.settings.client_id,
            redirect_uris: [ loginOptions.redirectUrl ],
            response_types: [ 'code' ],
            token_endpoint_auth_method: auth_method
        };
        if( auth_method !== 'none' ){
            const secret = options.client_secret || izIAM.settings.client_secret;
            if( !secret ){
                throw new Error( 'client secret is not set through required by authentication method not being none' );
            } else {
                clientParms.client_secret = secret;
            }
        }
        const client = new izIAM.Issuer.Client( clientParms );

        // store the code_verifier in the 'state' parameter which is brought back in the callback
        loginOptions.code_verifier = generators.codeVerifier();
        loginOptions.code_challenge = generators.codeChallenge( loginOptions.code_verifier );

        let scopes = ( options.scopes && options.scopes.length ) ? options.scopes : (( izIAM.settings.scopes && izIAM.settings.scopes.length ) ? izIAM.settings.scopes : [] );
        if( !scopes.includes( 'openid' )){
            scopes.push( 'openid' );
        }

        const url = client.authorizationUrl({
            scope: scopes.join( ' ' ),
            resource: izIAM.settings.resources,
            code_challenge: loginOptions.code_challenge,
            code_challenge_method: 'S256',
            state: izIAM.s._stateEncode( loginOptions )
        });
        //console.debug( 'url', url );
        loginOptions.url = url;

        izIAM.serviceConfiguration = serviceConfiguration;
        izIAM.client = client;

        return loginOptions;
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

    // try to discover the OpenID issuer
    //  first run when envSettings are available
    //  then retried each time a connection is requested
    async tryDiscover(){
        if( !izIAM.settings ){
            const settings = EnvSettings.environmentServerSettings();
            if( settings && settings.private && settings.private[izIAM.C.Service]  ){
                console.debug( 'set izIAM service settings from private server settings per environment' );
                izIAM.settings = settings.private[izIAM.C.Service];
            }
        }
        //console.debug( 'izIAM.settings', izIAM.settings );
        let promises = [];
        if( izIAM.settings ){
            if( !izIAM.Issuer ){
                if( izIAM.settings.issuerUrl ){
                    promises.push( Issuer.discover( izIAM.settings.issuerUrl )
                        .then(( issuer ) => {
                            console.debug( 'set izIAM.Issuer after successful '+izIAM.C.Service+' discovery' );
                            izIAM.Issuer = issuer;
                        })
                        .catch(( e ) => {
                            // may happen that the Issuer be temporarily unavailable - will have to retry later
                            console.warn( e );
                        }));
                } else {
                    console.warn( izIAM.C.Service, 'issuerUrl is not set' );
                }
            }
        }
        await Promise.allSettled( promises );
    }
};
//