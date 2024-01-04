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
    //const params = izIAM.client.callbackParams( query );
    const options = izIAM.s._stateDecode( query.state );
    console.debug( 'query', query, 'options', options );
    //delete query.state;
    let tokenSet;
    return izIAM.client.callback( options.redirect, query, {
        state: query.state,
        code_verifier: options.verifier,
        //response_type: 'code'
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
        //userInfo = userinfo;
        // userinfo {"sub":"sdfgh"}
        console.log( 'userinfo %j', userinfo );

        let serviceData = userinfo;
        serviceData.id = userinfo.sub;
        serviceData.accessToken = tokenSet.access_token;
        serviceData.refreshToken = tokenSet.refresh_token;
        serviceData.expiresAt = tokenSet.expires_at;
        //serviceData.email = userinfo[process.env.OAUTH2_EMAIL_MAP] || userinfo[email];
        //serviceData.sub = userInfo.sub;

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

    //var token = getToken(query);
    //if( debug ) console.debug( 'XXX: register token:', token );

    /*
    var accessToken = token.access_token || token.id_token;
    var expiresAt = ( +new Date ) + ( 1000 * parseInt( token.expires_in, 10 ));

    var userinfo = getUserInfo( accessToken );
    if( debug ) console.debug( 'XXX: userinfo:', userinfo );

    var serviceData = {};
    serviceData.id = userinfo[process.env.OAUTH2_ID_MAP] || userinfo[id];
    serviceData.username = userinfo[process.env.OAUTH2_USERNAME_MAP] || userinfo[uid];
    serviceData.fullname = userinfo[process.env.OAUTH2_FULLNAME_MAP] || userinfo[displayName];
    serviceData.accessToken = accessToken;
    serviceData.expiresAt = expiresAt;
    serviceData.email = userinfo[process.env.OAUTH2_EMAIL_MAP] || userinfo[email];

    if( accessToken ){
        var tokenContent = getTokenContent( accessToken );
        var fields = _.pick( tokenContent, getConfiguration().idTokenWhitelistFields );
        _.extend( serviceData, fields );
    }

    if( token.refresh_token )
        serviceData.refreshToken = token.refresh_token;
    if( debug ) console.debug( 'XXX: serviceData:', serviceData );

    var profile = {};
    profile.name = userinfo[process.env.OAUTH2_FULLNAME_MAP] || userinfo[displayName];
    profile.email = userinfo[process.env.OAUTH2_EMAIL_MAP] || userinfo[email];
    if( debug ) console.debug( 'XXX: profile:', profile );

    return {
        serviceData: serviceData,
        options: { profile: profile }
    };
    */
});

/*
OAuth._endOfLoginResponse = (res, details) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
  
    let redirectUrl;
    if (details.loginStyle === 'redirect') {
      redirectUrl = OAuth._stateFromQuery(details.query).redirectUrl;
      const appHost = Meteor.absoluteUrl();
      if (
        !Meteor.settings?.packages?.oauth?.disableCheckRedirectUrlOrigin &&
        OAuth._checkRedirectUrlOrigin(redirectUrl)) {
        details.error = `redirectUrl (${redirectUrl}` +
          `) is not on the same host as the app (${appHost})`;
        redirectUrl = appHost;
      }
    }
  
    const isCordova = OAuth._isCordovaFromQuery(details.query);
  
    if (details.error) {
      consoles.warn("Error in OAuth Server: " +
               (details.error instanceof Error ?
                details.error.message : details.error));
      res.end(renderEndOfLoginResponse({
        loginStyle: details.loginStyle,
        setCredentialToken: false,
        redirectUrl,
        isCordova,
      }), "utf-8");
      return;
    }
  
    // If we have a credentialSecret, report it back to the parent
    // window, with the corresponding credentialToken. The parent window
    // uses the credentialToken and credentialSecret to log in over DDP.
    res.end(renderEndOfLoginResponse({
      loginStyle: details.loginStyle,
      setCredentialToken: true,
      credentialToken: details.credentials.token,
      credentialSecret: details.credentials.secret,
      redirectUrl,
      isCordova,
    }), "utf-8");
  };
  */


/*
// some OAuth providers do require a userAgent
var userAgent = 'Meteor';
if( Meteor.release ){
    userAgent += '/' + Meteor.release;
}

var getToken = function( query ){
    var debug = process.env.DEBUG || false;
    var config = getConfiguration();
    var serverTokenEndpoint = config.serverUrl + config.tokenEndpoint;
    var response;

    try {
        response = HTTP.post(
            serverTokenEndpoint,
            {
                headers: {
                    Accept: 'application/json',
                    "User-Agent": userAgent
                },
                params: {
                    code: query.code,
                    client_id: config.clientId,
                    client_secret: OAuth.openSecret(config.secret),
                    redirect_uri: OAuth._redirectUri('oidc', config),
                    grant_type: 'authorization_code',
                    state: query.state
                }
            }
        );
    } catch( err ){
        throw _.extend( new Error( 'Failed to get token from izIAM ' + serverTokenEndpoint + ': ' + err.message ), { response: err.response });
    }
    if( response.data.error ){
        // if the http response was a json object with an error attribute
        throw new Error( 'Failed to complete handshake with izIAM ' + serverTokenEndpoint + ': ' + response.data.error );
    } else {
        if( debug ) console.debug( 'XXX: getToken response: ', response.data );
        return response.data;
    }
};

var getUserInfo = function( accessToken ){
    var debug = process.env.DEBUG || false;
    var config = getConfiguration();
    // Some userinfo endpoints use a different base URL than the authorization or token endpoints.
    // This logic allows the end user to override the setting by providing the full URL to userinfo in their config.
    if( config.userinfoEndpoint.includes( 'https://' )){
        var serverUserinfoEndpoint = config.userinfoEndpoint;
    } else {
        var serverUserinfoEndpoint = config.serverUrl + config.userinfoEndpoint;
    }
    var response;
    try {
        response = HTTP.get(
            serverUserinfoEndpoint,
            {
                headers: {
                    "User-Agent": userAgent,
                    "Authorization": "Bearer " + accessToken
                }
            }
        );
    } catch( err ){
        throw _.extend( new Error( 'Failed to fetch userinfo from izIAM ' + serverUserinfoEndpoint + ': ' + err.message ), { response: err.response });
    }
    if( debug ) console.debug( 'XXX: getUserInfo response: ', response.data );
    return response.data;
};

var getConfiguration = function(){
    var config = ServiceConfiguration.configurations.findOne({ service: izIAM.C.Service });
    if( !config ){
        throw new ServiceConfiguration.ConfigError( 'Service '+izIAM.C.Service+' not configured.' );
    }
    return config;
};

var getTokenContent = function( token ){
    var content = null;
    if( token ){
        try {
            var parts = token.split('.');
            var header = JSON.parse(new Buffer(parts[0], 'base64').toString());
            content = JSON.parse(new Buffer(parts[1], 'base64').toString());
            var signature = new Buffer(parts[2], 'base64');
            var signed = parts[0] + '.' + parts[1];
            } catch( err ){
                this.content = {
                    exp: 0
                };
        }
    }
    return content;
}
*/

izIAM.retrieveCredential = function( credentialToken, credentialSecret ){
    console.debug( '** in izIAM.retrieveCredential()' );
    return OAuth.retrieveCredential( credentialToken, credentialSecret );
};
