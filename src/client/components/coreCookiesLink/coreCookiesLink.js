/*
 * /imports/client/components/coreCookiesLink/coreCookiesLink.js
 */

import { pwixI18n } from 'meteor/pwix:i18n';

import './coreCookiesLink.html';

Template.coreCookiesLink.helpers({

    // the label
    label(){
        return this.label || pwixI18n.label( I18N, 'cookieslink.label' );
    },

    // the route
    route(){
        return this.route || ( CoreUI._conf.routePrefix || '' )+'/cookies';
    },

    // the title
    title(){
        return this.title || pwixI18n.label( I18N, 'cookieslink.title' );
    }
});
