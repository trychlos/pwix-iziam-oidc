/*
 * pwix:iziam-oidc/src/server/js/autorun.js
 */

import { CoreApp } from 'meteor/pwix:core-app';
import { Tracker } from 'meteor/tracker';

// load izIAM settings from settings per environment
Tracker.autorun(() => {
    const envSettings = CoreApp.envSettings.get();
    if( envSettings && envSettings.settings && envSettings.settings[izIAM.C.Service]  ){

        console.debug( 'set izIAM.settings from server settings per environment' );
        izIAM.settings = envSettings.settings[izIAM.C.Service];
        izIAM.s.tryDiscover();

    } else {
        console.warn( izIAM.C.Service, 'configuration not available' );
    }
});
