/*
 * pwix:ui-core/src/common/js/configure.js
 */

import merge from 'merge';

uiCore._defaults = {
    verbosity: PCC_VERBOSE_NONE
};

uiCore.configure = function( o ){
    uiCore._conf = merge.recursive( true, uiCore._defaults, o );

    // be verbose if asked for
    if( uiCore._conf.verbosity & PCC_VERBOSE_CONFIGURE ){
        console.debug( 'pwix:ui-core configure() with', o, 'building', uiCore._conf );
    }
}

uiCore._conf = merge.recursive( true, uiCore._defaults );
