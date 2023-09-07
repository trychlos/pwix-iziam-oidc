/*
 * /src/client/classes/page.class.js
 *
 * This class manages a defined page, with a schema defined as a SimpleSchema.
 */

import SimpleSchema from 'simpl-schema';

export class Page {

    // static data

    static Schema = null;

    // static methods

    // private data
    _name = null;
    _def = null;

    // private methods

    // public data

    /**
     * Constructor
     * @param {String} name the page name
     * @param {Object} def the page definition as a javascript object
     * @returns {Page} a Page object
     * @throws {Exception} if the provided definition is not valid
     */
    constructor( name, def ){
        if( !Page.Schema ){
            Page.Schema = new SimpleSchema({

                // the page's name
                name: {
                    type: String
                },

                // the layout to be applied to the page
                layout: {
                    type: String,
                    optional: true,
                    defaultValue: CoreUI._conf.layout
                },

                // the role(s) needed to just have a display access to this page
                // Depending of the page, this may not give access to each and every possibe features in that page.
                rolesAccess: {
                    type: Array,
                    optional: true,
                    defaultValue: []
                },
                'rolesAccess.$': {
                    type: String
                },

                // the role(s) needed to open an editor on this page
                // Defaulting to APP_ADMIN (as this role may nonetheless do anything in the application)
                // only relevant if there is something to edit on that page
                rolesEdit: {
                    type: Array,
                    optional: true,
                    defaultValue: [ CoreUI._conf.adminRole ]
                },
                'rolesEdit.$': {
                    type: String
                },

                // the route to the page
                // MANDATORY (no default): without this option, the page is inaccessible.
                route: {
                    type: String,
                    optional: true
                },

                // the template to be loaded
                // MANDATORY (no default): without this option, the page is just not rendered.
                template: {
                    type: String,
                    optional: true
                },

                // the theme to be applied
               theme: {
                    type: String,
                    optional: true,
                    defaultValue: CoreUI._conf.theme
                },

                // whether we want a 'edit now' toggle switch on the top of the page.
                // Obviously only relevant if there is something to edit on the page.
                wantEditionSwitch: {
                    type: Boolean,
                    optional: true,
                    defaultValue: false
                }
            });
        }
        // may throw an exception
        Page.Schema.validate({ name: name, ...def });

        this._name = name;
        this._def = { ...def };
    
        return this;
    }

    /**
     * @returns the page layout
     */
    layout(){
        return this._def.layout || CoreUI._conf.layout;
    }

    /**
     * @returns the page name
     */
    name(){
        return this._name;
    }

    /**
     * @returns the roles needed to just access the page, maybe empty
     */
    rolesAccess(){
        return this._def.rolesAccess || [];
    }

    /**
     * @returns the roles needed to edit the page content
     */
    rolesEdit(){
        return this._def.rolesEdit || [ CoreUI._conf.adminRole ];
    }

    /**
     * @returns the page route, null if unset
     */
    route(){
        return this._def.route || null;
    }

    /**
     * @returns the page template, null if unset
     */
    template(){
        return this._def.template || null;
    }

    /**
     * @returns the page theme
     */
    theme(){
        return this._def.theme || CoreUI._conf.theme;
    }

    /**
     * @returns whether the page supports an edition toggle switch
     */
    wantEditionSwitch(){
        return this._def.wantEditionSwitch;
    }
}
