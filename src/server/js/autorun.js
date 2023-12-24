/*
 * pwix:iziam-oidc/src/server/js/autorun.js
 */

import { CoreUI } from 'meteor/pwix:core-ui';
import { Issuer } from 'openid-client';
import { Tracker } from 'meteor/tracker';

// load izIAM settings from settings per environment
Tracker.autorun(() => {
    const envSettings = CoreUI.envSettings.get();
    if( envSettings && envSettings.settings && envSettings.settings[izIAM.C.Service]  ){

        console.debug( 'set izIAM.settings from server settings per environment' );
        izIAM.settings = envSettings.settings[izIAM.C.Service];

        if( izIAM.settings.rootUrl ){
            Issuer.discover( izIAM.settings.rootUrl )
                .then(( issuer ) => {
                    console.debug( 'set izIAM.Issuer after successful '+izIAM.C.Service+' discovery' );
                    izIAM.Issuer = issuer;
                });
            }
    } else {
        console.warn( izIAM.C.Service, 'configuration not available' );
    }
});
