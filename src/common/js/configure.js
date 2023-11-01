/*
 * pwix:core-ui/src/common/js/configure.js
 */

import _ from 'lodash';

CoreUI._conf = {};

CoreUI._defaults = {
    adminRole: 'APP_ADMINISTRATOR',
    menuIcon: 'fa-chevron-right',
    routePrefix: '/coreUI',
    theme: 't-page',
    verbosity: CoreUI.C.Verbose.NONE
};

/**
 * @summary Get/set the package configuration
 *  Should be called *in same terms* both by the client and the server.
 * @param {Object} o configuration options
 * @returns {Object} the package configuration
 */
CoreUI.configure = function( o ){
    if( o && _.isObject( o )){
        _.merge( CoreUI._conf, CoreUI._defaults, o );
        // be verbose if asked for
        if( CoreUI._conf.verbosity & CoreUI.C.Verbose.CONFIGURE ){
            //console.log( 'pwix:core-ui configure() with', o, 'building', CoreUI._conf );
            console.log( 'pwix:core-ui configure() with', o );
        }
    }
    // also acts as a getter
    return CoreUI._conf;
}

_.merge( CoreUI._conf, CoreUI._defaults );
