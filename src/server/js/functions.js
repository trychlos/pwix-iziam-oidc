/*
 * pwix:iziam-oidc/src/server/js/functions.js
 */

import _ from 'lodash';
import { generators, Issuer } from 'openid-client';

import { Random } from 'meteor/random';
import { ServiceConfiguration } from 'meteor/service-configuration';

izIAM.s = {
    // make sure that provided scopes are single-spaces separated and appear only once
    //  @param {String|Array<String>} a list of scopes
    //  @param {String} a string of each scope appears only once
    checkScopes( a ){
        const b = _.isArray( a ) ? a : [ a ];   // be sure to have an array of strings
        let c = {};
        ( b || [] ).every(( d ) => {            // explore array
            const e = d.split( /\s+/ );         // be sure to have an array of single words
            ( e || [] ).every(( f ) => {        // and for each word...
                c[f] = true;
                return true;
            });
            return true;
        });
        return Object.keys( c ).join( ' ' );
    },

    // try to discover the OpenID issuer
    //  first run when envSettings are available
    //  then retried each time a connection is requested
    tryDiscover(){
        if( !izIAM.Issuer ){
            if( izIAM.settings.rootUrl ){
                Issuer.discover( izIAM.settings.rootUrl )
                    .then(( issuer ) => {
                        console.debug( 'set izIAM.Issuer after successful '+izIAM.C.Service+' discovery' );
                        izIAM.Issuer = issuer;
                    })
                    .catch(( e ) => {
                        // may happen that the Issuer be temporarily unavailable - will have to retry later
                        console.warn( e );
                    });
            } else {
                console.warn( izIAM.C.Service, 'rootUrl is not set' );
            }
        }
    },

    // return the config as read from settings and systematically set in ServiceConfiguration collection
    //  making sure to work with last version
    getConfig(){
        ServiceConfiguration.configurations.remove({ service: izIAM.C.Service });
        const set = {
            loginStyle: izIAM.settings.loginStyle || 'popup',
            clientId: izIAM.settings.clientId,
            secret: izIAM.settings.clientSecret,
            serverUrl: izIAM.settings.rootUrl,
            resource: izIAM.settings.resource,
            authorizationEndpoint: izIAM.Issuer.authorization_endpoint.substring( izIAM.settings.rootUrl.length ),
            tokenEndpoint: izIAM.Issuer.token_endpoint.substring( izIAM.settings.rootUrl.length ),
            userinfoEndpoint: izIAM.Issuer.userinfo_endpoint.substring( izIAM.settings.rootUrl.length ),
            idTokenWhitelistFields: [],
            redirectUrl: izIAM.settings.redirectUrl
        };
        ServiceConfiguration.configurations.upsert({ service: izIAM.C.Service }, { $set: set });
        config = ServiceConfiguration.configurations.findOne({ service: izIAM.C.Service });
        console.debug( 'get ServiceConfiguration', config );
        return config;
    },

    // Prepare the needed options
    //  taking advantage of being server side to have openid-client resources
    //  this is called as a method from the client requestCredential() function
    prepareLogin( options ){

        // make sure we have read the settings from the server and got an Issuer
        if( !izIAM.settings ){
            throw new Error( 'izIAM settings are not available' );
        }
        if( !izIAM.Issuer ){
            throw new Error( 'Issuer has not been discovered' );
        }

        const loginOptions = {};
        loginOptions.config = izIAM.s.getConfig();

        // needed here (server side) in order to be embedded in the 'state' parm in order to be able to close the modal later
        loginOptions.redirectUrl = options.redirectUrl || loginOptions.config.redirectUrl;
        loginOptions.loginStyle = options.loginStyle || loginOptions.config.loginStyle;

        // Meteor.OAuth requires a credentialToken in the 'state'
        loginOptions.credentialToken = Random.secret();

        const client = new izIAM.Issuer.Client({
            client_id: loginOptions.config.clientId,
            client_secret: loginOptions.config.secret,
            redirect_uris: [ loginOptions.redirectUrl ],
            response_types: [ 'code' ]
        });
        console.debug( 'client', client );

        // store the code_verifier in the 'state' parameter which is brought back in the callback
        loginOptions.code_verifier = generators.codeVerifier();
        loginOptions.code_challenge = generators.codeChallenge( loginOptions.code_verifier );

        const url = client.authorizationUrl({
            scope: 'openid iz_profile offline_access',
            resource: izIAM.settings.resource,
            code_challenge: loginOptions.code_challenge,
            code_challenge_method: 'S256',
            state: izIAM.s._stateEncode( loginOptions )
        });
        loginOptions.url = url;

        izIAM.serviceConfiguration = loginOptions.config;
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
    }
};
//