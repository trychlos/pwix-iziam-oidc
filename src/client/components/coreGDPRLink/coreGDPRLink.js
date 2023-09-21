/*
 * /src/client/components/coreGDPRLink/coreGDPRLink.js
 */

import './coreGDPRLink.html';

Template.coreGDPRLink.helpers({
    // the label
    label(){
        return this.label || pwixI18n.label( I18N, 'gdprlink.label' );
    },

    // the route
    route(){
        return ( CoreUI._conf.routePrefix || '' ) + ( this.route || '/gdpr' );
    },

    // the title
    title(){
        return this.title || pwixI18n.label( I18N, 'gdprlink.title' );
    }
});
