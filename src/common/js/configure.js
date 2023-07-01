/*
 * pwix:ui-core/src/common/js/configure.js
 */

import merge from 'merge';

pckTemplate._defaults = {
    verbosity: PCK_VERBOSE_NONE
};

pckTemplate.configure = function( o ){
    pckTemplate._conf = merge.recursive( true, pckTemplate._defaults, o );

    // be verbose if asked for
    if( pckTemplate._conf.verbosity & PCK_VERBOSE_CONFIGURE ){
        console.debug( 'pwix:ui-core configure() with', o, 'building', pckTemplate._conf );
    }
}

pckTemplate._conf = merge.recursive( true, pckTemplate._defaults );
