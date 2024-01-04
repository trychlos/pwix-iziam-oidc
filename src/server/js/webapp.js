/*
 * pwix:iziam-oidc/src/server/js/webapp.js
 */

import { WebApp } from 'meteor/webapp';

WebApp.connectHandlers.use( '/cb', ( req, res, next ) => {
    // get an authorization code
    const params = izIAM.client.callbackParams( req );
    const options = izIAM.s._stateDecode( params.state );
    delete params.state;
    console.debug( 'webapp handler:', params, options );
    izIAM.client.callback( options.redirect, params, { code_verifier: options.verifier })
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
        });
});
