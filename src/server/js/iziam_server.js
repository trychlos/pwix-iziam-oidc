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

OAuth.registerService( iziamOIDC.C.Service, 2, null, function( query ){

    const debugQuery = false;
    const debugToken = true;

    // get the authorization code in query.code
    const options = iziamOIDC.s._stateDecode( query.state );
    debugQuery && logger.debug( 'OAuth.registerService() query', query, 'options', options );

    return iziamOIDC.s.client.callback( options.redirect, query, {
        state: query.state,
        code_verifier: options.verifier,
        response_type: 'code'
    })
    .then(( tks ) => {
        iziamOIDC.s.tokenSet = tks;
        let promises = [];
        // get an access code with 'openid' scope as an object:
        //  access_token:
        //  expires_at:
        //  id_token:
        //  scope: 'email profile'  aka requested scopes, without (eaten) 'openid'
        //  token_type: 'Bearer'
        debugToken && logger.debug( 'OAuth.registerService() received and validated tokens %j', iziamOIDC.s.tokenSet );
        // claims is an object
        //  sub: <login>
        //  at_hash: ?
        //  aud: <client_id>
        //  exp: <timestamp>
        //  iat: <timestamp>
        //  iss: <OP Issuer>
        debugToken && logger.debug( 'OAuth.registerService() validated ID Token claims %j', iziamOIDC.s.tokenSet.claims());

        // access token introspection
        if( debugToken && iziamOIDC.s.issuer?.introspection_endpoint ){
            promises.push( iziamOIDC.s.client.introspect( iziamOIDC.s.tokenSet.access_token ).then(( res ) => {
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
        if( iziamOIDC.s.issuer?.userinfo_endpoint ){
            return iziamOIDC.s.client.userinfo( iziamOIDC.s.tokenSet.access_token ).then(( userinfo ) => {
                debugToken && logger.debug( 'OAuth.registerService() userinfo', userinfo );

                let serviceData = userinfo;
                serviceData.id = userinfo.sub;
                serviceData.accessToken = iziamOIDC.s.tokenSet.access_token;
                serviceData.refreshToken = iziamOIDC.s.tokenSet.refresh_token;
                serviceData.expiresAt = iziamOIDC.s.tokenSet.expires_at;

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

iziamOIDC.retrieveCredential = function( credentialToken, credentialSecret ){
    //logger.debug( 'iziamOIDC.retrieveCredential()' );
    return OAuth.retrieveCredential( credentialToken, credentialSecret );
};
