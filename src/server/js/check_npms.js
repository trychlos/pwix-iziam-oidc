/*
 * pwix:iziam-oidc/src/server/js/check_npms.js
 */

import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

if( false ){
    // whitelist packages which are included via a subfolder or badly recognized
    require( 'openid-client/package.json' );
}

checkNpmVersions({
    'lodash': '^4.17.0',
    'openid-client': '^5.6.1'
},
    'pwix:iziam-oidc'
);
