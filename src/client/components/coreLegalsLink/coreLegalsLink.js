/*
 * /src/client/components/coreLegalsLink/coreLegalsLink.js
 */

import './coreLegalsLink.html';

Template.coreLegalsLink.helpers({
    // the label
    label(){
        return this.label || pwixI18n.label( I18N, 'legalslink.label' );
    },

    // the route
    route(){
        return ( CoreUI._conf.routePrefix || '' ) + ( this.route || '/legals' );
    },

    // the title
    title(){
        return this.title || pwixI18n.label( I18N, 'legalslink.title' );
    }
});
