/*
 * pwix:iziam/src/common/js/configure.js
 */

import _ from 'lodash';

izIAM._conf = {};

izIAM._defaults = {
    verbosity: izIAM.C.Verbose.NONE
};

/**
 * @summary Get/set the package configuration
 *  Should be called *in same terms* both by the client and the server.
 * @param {Object} o configuration options
 * @returns {Object} the package configuration
 */
izIAM.configure = function( o ){
    if( o && _.isObject( o )){
        _.merge( izIAM._conf, izIAM._defaults, o );
        // be verbose if asked for
        if( izIAM._conf.verbosity & izIAM.C.Verbose.CONFIGURE ){
            //console.log( 'pwix:iziam configure() with', o, 'building', izIAM._conf );
            console.log( 'pwix:iziam configure() with', o );
        }
    }
    // also acts as a getter
    return izIAM._conf;
}

_.merge( izIAM._conf, izIAM._defaults );
