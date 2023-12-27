/*
 * pwix:iziam-oidc/src/server/js/webapp.js
 */

import { WebApp } from 'meteor/webapp';

WebApp.connectHandlers.use( '/cb', ( req, res, next ) => {
    // get an authorization code
    const params = izIAM.client.callbackParams( req );
    console.debug( 'webapp handler: params', params );
    const verifier = Buffer.from( params.state, 'base64' ).toString( 'ascii' );
    delete params.state;
    console.debug( 'verifier', verifier );
    izIAM.client.callback( 'https://devel.trychlos.org/cb', params, { code_verifier: verifier })
        .then(( tokenSet ) => {
            // get an access code with 'openid' scope as an object:
            //  access_token:
            //  expires_at:
            //  id_token:
            //  scope: 'openid'
            //  token_type: 'Bearer'
            console.log( 'received and validated tokens %j', tokenSet );
            // claims is an object
            //  sub: 'iziam'
            //  at_hash: ?
            //  aud: client_id
            //  exp: timestamp
            //  iat: ?
            //  iss: OP Issuer
            console.log( 'validated ID Token claims %j', tokenSet.claims());
            return izIAM.client.userinfo( tokenSet.access_token )
        })
        .then(( userinfo ) => {
            console.log( 'userinfo %j', userinfo );
        })
});
