/*
 * pwix:iziam-oidc/src/server/js/iziam_server.js
 */

import _ from 'lodash';

// query: {
//  code: 'QTVKAjLBsabX9hlHZS7xUFATAypUOw965oGmkEMWzhu',
//  state: 'eyJsb2dpblN0eWxlIjoicG9wdXAiLCJ2ZXJpZmllciI6IkpFUW16akotVVd3U2VSV2lEc1BOVDhpVC1KOEVLTkhTNUk1aXJWVE5LZTgiLCJyZWRpcmVjdCI6Imh0dHBzOi8vZGV2ZWwudHJ5Y2hsb3Mub3JnL19vYXV0aC9peklBTSIsImNyZWRlbnRpYWxUb2tlbiI6IlBTTVY4a0Y3NUlzcGxfTTRmZlhxeW9OUGM2ZWp0RVpJengxaHU4YUFudjQifQ==',
//  iss: 'http://localhost:3003/bbb'
// }
// OAuth request handler
//  query.code is the received authorization code

OAuth.registerService( izIAM.C.Service, 2, null, function( query ){

    var debug = true; //process.env.DEBUG || false;
    //console.debug( 'query', query );

    // get the authorization code in query.code
    const options = izIAM.s._stateDecode( query.state );
    console.debug( 'query', query, 'options', options );
    //delete query.state;
    let tokenSet;
    return izIAM.client.callback( options.redirect, query, {
        state: query.state,
        code_verifier: options.verifier,
        response_type: 'code'
    })
    .then(( tks ) => {
        tokenSet = tks;
        // get an access code with 'openid' scope as an object:
        //  access_token:
        //  expires_at:
        //  id_token:
        //  scope: 'email profile'  aka requested scopes, without (eaten) 'openid'
        //  token_type: 'Bearer'
        console.log( 'received and validated tokens %j', tokenSet );
        // claims is an object
        //  sub: 'iziam'
        //  at_hash: ?
        //  aud: <client_id>
        //  exp: <timestamp>
        //  iat: ?
        //  iss: <OP Issuer>
        console.log( 'validated ID Token claims %j', tokenSet.claims());
        return izIAM.client.introspect( tokenSet.access_token );
    })
    .then(( response ) => {
        console.debug( 'access_token introspection:', response );
        return izIAM.client.introspect( tokenSet.id_token );
    })
    .then(( response ) => {
        console.debug( 'id_token introspection:', response );   // { active: false }
        return izIAM.client.userinfo( tokenSet.access_token )
    })
    .then(( userinfo ) => {
        console.log( 'userinfo %j', userinfo );

        let serviceData = userinfo;
        serviceData.id = userinfo.sub;
        serviceData.accessToken = tokenSet.access_token;
        serviceData.refreshToken = tokenSet.refresh_token;
        serviceData.expiresAt = tokenSet.expires_at;

        const o = {
            serviceData: serviceData,
            options: { profile: {}}
        };
        console.debug( 'returning', o );
        return o;
    })
    .catch(( e ) => {
        console.error( e );
    });
});

izIAM.retrieveCredential = function( credentialToken, credentialSecret ){
    console.debug( 'izIAM.retrieveCredential()' );
    return OAuth.retrieveCredential( credentialToken, credentialSecret );
};
