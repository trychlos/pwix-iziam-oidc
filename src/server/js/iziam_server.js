/*
 * pwix:iziam-oidc/src/server/js/iziam_server.js
 */

import _ from 'lodash';

import { Logger } from 'meteor/pwix:logger';

const logger = Logger.get();

// query: {
//  code: 'QTVKAjLBsabX9hlHZS7xUFATAypUOw965oGmkEMWzhu',
//  state: 'eyJsb2dpblN0eWxlIjoicG9wdXAiLCJ2ZXJpZmllciI6IkpFUW16akotVVd3U2VSV2lEc1BOVDhpVC1KOEVLTkhTNUk1aXJWVE5LZTgiLCJyZWRpcmVjdCI6Imh0dHBzOi8vZGV2ZWwudHJ5Y2hsb3Mub3JnL19vYXV0aC9peklBTSIsImNyZWRlbnRpYWxUb2tlbiI6IlBTTVY4a0Y3NUlzcGxfTTRmZlhxeW9OUGM2ZWp0RVpJengxaHU4YUFudjQifQ==',
//  iss: 'http://localhost:3003/bbb'
// }
// OAuth request handler
//  query.code is the received authorization code

OAuth.registerService( izIAM.C.Service, 2, null, function( query ){

    const debugQuery = false;
    const debugToken = true;

    // get the authorization code in query.code
    const options = izIAM.s._stateDecode( query.state );
    debugQuery && logger.debug( 'OAuth.registerService() query', query, 'options', options );

    return izIAM.s.client.callback( options.redirect, query, {
        state: query.state,
        code_verifier: options.verifier,
        response_type: 'code'
    })
    .then(( tks ) => {
        izIAM.s.tokenSet = tks;
        let promises = [];
        // get an access code with 'openid' scope as an object:
        //  access_token:
        //  expires_at:
        //  id_token:
        //  scope: 'email profile'  aka requested scopes, without (eaten) 'openid'
        //  token_type: 'Bearer'
        debugToken && logger.debug( 'OAuth.registerService() received and validated tokens %j', izIAM.s.tokenSet );
        // claims is an object
        //  sub: <login>
        //  at_hash: ?
        //  aud: <client_id>
        //  exp: <timestamp>
        //  iat: <timestamp>
        //  iss: <OP Issuer>
        debugToken && logger.debug( 'OAuth.registerService() validated ID Token claims %j', izIAM.s.tokenSet.claims());

        // access token introspection
        if( debugToken && izIAM.s.issuer?.introspection_endpoint ){
            promises.push( izIAM.s.client.introspect( izIAM.s.tokenSet.access_token ).then(( res ) => {
                logger.debug( 'OAuth.registerService() access_token introspection:', res );
                return res;
            }));
        }

        // ID Token is NOT introspectable
        //  the request returns: '{ active: false }'

        // just wait for introspections completion
        return Promise.allSettled( promises );
    })
    .then(() => {
        if( izIAM.s.issuer?.userinfo_endpoint ){
            return izIAM.s.client.userinfo( izIAM.s.tokenSet.access_token ).then(( userinfo ) => {
                debugToken && logger.debug( 'OAuth.registerService() userinfo', userinfo );

                let serviceData = userinfo;
                serviceData.id = userinfo.sub;
                serviceData.accessToken = izIAM.s.tokenSet.access_token;
                serviceData.refreshToken = izIAM.s.tokenSet.refresh_token;
                serviceData.expiresAt = izIAM.s.tokenSet.expires_at;

                const o = {
                    serviceData: serviceData,
                    options: { profile: {}}
                };

                debugToken && logger.debug( 'OAuth.registerService() returning', o );
                return o;
            });
        } else {
            logger.warn( 'OAuth.registerService() userinfo_endpoint is not set' );
            return null;
        }
    })
    .catch(( e ) => {
        logger.error( e );
    });
});

izIAM.retrieveCredential = function( credentialToken, credentialSecret ){
    //logger.debug( 'izIAM.retrieveCredential()' );
    return OAuth.retrieveCredential( credentialToken, credentialSecret );
};
