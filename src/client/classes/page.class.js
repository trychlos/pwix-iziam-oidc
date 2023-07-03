/*
 * /imports/client/classes/page.class.js
 *
 * This class manages the displayed page as a singleton object, which acts as a reactive datasource.
 * It updates itself each time the route changes.
 * 
 * Client only.
 */

import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Tracker } from 'meteor/tracker';

export class Page {

    // static data
    static Singleton = null;

    // private data
    _vars = {
        dep: new Tracker.Dependency(),
        name: null,
        page: null
    };

    // private functions

    // public data

    /**
     * Constructor
     * @returns {Page} the singleton instance
     */
    constructor( name ){
        if( Page.Singleton ){
            console.log( 'trying to instanciates a new instance of an already existing singleton, returning the singleton' );
            return Page.Singleton;
        }

        const self = this;

        // an autorun tracker which follows the current page name
        Tracker.autorun(() => {
            const name = FlowRouter.getRouteName();
            self.name( name );
        });

        Page.Singleton = this;
        return this;
    }

    /**
     * Getter/Setter
     * @param {String} name the name of the current page
     * @returns {String} the name of the current page
     *  Reactive method when used as a getter
     */
    name( name ){
        if( name !== undefined && name !== this._vars.name ){
            //console.log( 'setting page', name );
            this._vars.name = name;
            this._vars.page = { name:name, ...Meteor.APP.pagesList[name] };
            this._vars.dep.changed();
        } else {
            this._vars.dep.depend();
        }
        return this._vars.name;
    }

    /**
     * @returns {String} the name of the template to be rendered for this page
     *  The 'template' key is mandatory. No default is provided.
     *  Reactive method
     */
    template(){
        this._vars.dep.depend();
        let template = null;
        if( this._vars.page && this._vars.page.template ){
            template = this._vars.page.template;
        } else {
            console.error( 'template missing in the \''+this._vars.name+'\' page definition, redirecting' );
            FlowRouter.go( '/' );
        }
        return template;
    }

    /**
     * @returns {String} the name of the theme to be applied for this page
     *  Reactive method
     */
    theme(){
        this._vars.dep.depend();
        return this._vars.page ? this._vars.page.theme || Meteor.APP.defaults.theme : '';
    }
}
