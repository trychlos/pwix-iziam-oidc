/*
 * pwix:iziam-oidc/src/server/js/functions.js
 */

import { generators } from 'openid-client';

import { ServiceConfiguration } from 'meteor/service-configuration';

izIAM.s = {
    // return the config as read from ServiceConfiguration
    //  setup this same config if not already done
    getConfig(){
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
                idTokenWhitelistFields: [],
                redirectUrl: izIAM.settings.redirectUrl
            };
            console.debug( 'register ServiceConfiguration', set );
            ServiceConfiguration.configurations.upsert({ service: izIAM.C.Service }, { $set: set });
            config = ServiceConfiguration.configurations.findOne({ service: izIAM.C.Service });
        }
        console.debug( 'read ServiceConfiguration', config );
        return config;
    },

    // Prepare the needed options
    //  taking advantage of being server side to have openid-client resources
    prepareLogin( options ){
        const config = izIAM.s.getConfig();

        const client = new izIAM.Issuer.Client({
            client_id: config.clientId,
            client_secret: config.secret,
            redirect_uris: [ config.redirectUrl ],
            response_types: [ 'code' ]
            // id_token_signed_response_alg (default "RS256")
            // token_endpoint_auth_method (default "client_secret_basic")
        });

        const loginOptions = {};
        loginOptions.config = config;
    
        // store the code_verifier in the 'state' parameter which is brought back in the callback
        loginOptions.code_verifier = generators.codeVerifier();
        loginOptions.code_challenge = generators.codeChallenge( loginOptions.code_verifier );
        //console.debug( 'code_verifier', loginOptions.code_verifier );
        //console.debug( 'code_challenge', loginOptions.code_challenge );

        // scope is a space-separated list of keywords
        //  must have at least 'openid'
        //const scope = ( options && options.requestPermissions ) || ['user:email'];
        //const flatScope = scope.map( encodeURIComponent ).join( '+' );

        const url = client.authorizationUrl({
            scope: 'openid email profile',
            resource: 'urn:api',
            code_challenge: loginOptions.code_challenge,
            code_challenge_method: 'S256',
            state: Buffer.from( loginOptions.code_verifier ).toString( 'base64' )
        });
        //console.debug( 'authorizationUrl', url );
        loginOptions.url = url;

        izIAM.serviceConfiguration = config;
        izIAM.client = client;

        /*
        const credentialToken = Random.secret();
        const scope = ( options && options.requestPermissions ) || ['user:email'];
        const flatScope = scope.map( encodeURIComponent ).join( '+' );
        const loginStyle = OAuth._loginStyle( izIAM.C.Service, config, options );

        let allowSignup = '';
        if( Accounts._options?.forbidClientAccountCreation ){
            allowSignup = '&allow_signup=false'; // https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#parameters
        }

        const loginUrl =
            config.serverUrl + config.authorizationEndpoint +
            `?client_id=${config.clientId}` +
            `response_type=code` +
            `&response_mode=query` +
            `&scope=${flatScope}` +
            `&redirect_uri=${config.redirectUrl}` +
            `&state=${OAuth._stateParam(loginStyle, credentialToken, options && options.redirectUrl)}` +
            allowSignup;
        }
        */

        return loginOptions;
    }
};
