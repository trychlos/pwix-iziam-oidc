/*
 * pwix:iziam-oidc/src/server/js/iziam_server.js
 */

import _ from 'lodash';

OAuth.registerService( izIAM.C.Service, 2, null, function( query ){

    var debug = true; //process.env.DEBUG || false;
    var token = getToken(query);
    if( debug ) console.debug( 'XXX: register token:', token );

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
});

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

izIAM.retrieveCredential = function( credentialToken, credentialSecret ){
    return OAuth.retrieveCredential( credentialToken, credentialSecret );
};
