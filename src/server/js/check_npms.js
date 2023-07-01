/*
 * pwix:core-ui/src/server/js/check_npms.js
 */

import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

if( false ){
    // whitelist packages which are included via a subfolder or badly recognized
    // require( 'body-parser/package.json' );
}

checkNpmVersions({
    'merge': '^2.1.1'
},
    'pwix:core-ui'
);
