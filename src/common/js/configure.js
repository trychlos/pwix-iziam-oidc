/*
 * pwix:core-ui/src/common/js/configure.js
 */

import _ from 'lodash';

uiCore._defaults = {
    verbosity: PCC_VERBOSE_NONE
};

/**
 * @summary Get/set the package configuration
 *  Should be called *in same terms* both by the client and the server.
 * @param {Object} o configuration options
 * @returns {Object} the package configuration
 */
uiCore.configure = function( o ){
    if( o && _.isObject( o )){
        _.merge( uiCore._conf, uiCore._defaults, o );
        // be verbose if asked for
        if( uiCore._conf.verbosity & PCC_VERBOSE_CONFIGURE ){
            console.log( 'pwix:core-ui configure() with', o, 'building', uiCore._conf );
        }
    }
    // also acts as a getter
    return uiCore._conf;
}

_.merge( uiCore._conf, uiCore._defaults );
