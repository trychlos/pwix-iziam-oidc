/*
 * pwix:iziam-oidc/src/server/js/autorun.js
 */

import { CoreUI } from 'meteor/pwix:core-ui';
import { Issuer } from 'openid-client';
import { Tracker } from 'meteor/tracker';

// load izIAM settings from settings per environment
Tracker.autorun(() => {
    const envSettings = CoreUI.envSettings.get();
    if( envSettings && envSettings.settings && envSettings.settings[izIAM.C.service]  ){

        console.debug( 'set izIAM.settings from server settings per environment' );
        izIAM.settings = envSettings.settings[izIAM.C.service];

        if( izIAM.settings.discovery ){
            Issuer.discover( izIAM.settings.discovery )
                .then(( issuer ) => {
                    console.debug( 'set izIAM.Issuer after successful '+izIAM.C.service+' discovery' );
                    izIAM.Issuer = issuer;
                });
            }
    } else {
        console.warn( izIAM.C.service, 'configuration not available' );
    }
});
