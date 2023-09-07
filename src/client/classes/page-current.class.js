/*
 * /src/client/classes/page-current.class.js
 *
 * This class manages the currently displayed page as a singleton object, which acts as a reactive datasource.
 * It updates itself each time the route changes.
 * 
 * Permission returned here are relative to the current user, and are all reactive.
 */

import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { pwixRoles } from 'meteor/pwix:roles';
import { Tracker } from 'meteor/tracker';

import _ from 'lodash';

import { PagesCollection } from './pages-collection.class.js';

export class PageCurrent {

    // static data
    static Singleton = null;

    // static methods

    // private data
    _vars = {
        dep: new Tracker.Dependency(),
        page: null,
        user: null
    };

    // private methods

    // public data

    /**
     * Constructor
     * @returns {PageCurrent} the singleton instance
     */
    constructor(){
        if( PageCurrent.Singleton ){
            console.log( 'trying to instanciates a new instance of an already existing singleton, returning the singleton' );
            return PageCurrent.Singleton;
        }

        PageCurrent.Singleton = this;

        // an autorun tracker which follows the current page
        Tracker.autorun(() => {
            const name = FlowRouter.getRouteName();
            const page = name ? PagesCollection.byName( name ) : null;
            PageCurrent.Singleton.page( page );
        });

        // an autorun tracker which dynamically tracks the currently connected user
        Tracker.autorun(() => {
            const id = Meteor.userId();
            if( id !== this._vars.user ){
                // be verbose if asked for
                if( CoreUI._conf.verbosity & CoreUI.C.Verbose.PAGE ){
                    console.log( 'pwix:core-ui setting \''+id+'\' as current user' );
                }
                this._vars.user = id;
                this._vars.dep.changed();
            }
        });

        // an autorun tracker which dynamically tracks the roles attributed to the current user
        Tracker.autorun(() => {
            if( pwixRoles.ready()){
                const roles = pwixRoles.current();
                if( !_.isEqual( roles, this._vars.roles )){
                    // be verbose if asked for
                    if( CoreUI._conf.verbosity & CoreUI.C.Verbose.PAGE ){
                        console.log( 'pwix:core-ui setting \''+roles+'\' as current roles' );
                    }
                    this._vars.roles = roles;
                    this._vars.dep.changed();
                }
            }
        });

        // an autorun tracker which redirect to home page if user is not habilited to this one
        Tracker.autorun(() => {
            if( this._vars.page && !PageCurrent.Singleton.accessAllowed()){
                console.log( 'Page', this._vars.page, 'not allowed, redirecting to \'/\'' );
                FlowRouter.redirect( '/' );
            }
        });

        return this;
    }

    /**
     * Getter/Setter
     * @param {Page} page the current Page
     * @returns {Page} the current Page
     *  Reactive method when used as a getter
     */
    page( page ){
        if( page && ( !this._vars.page || page.name() !== this._vars.page.name())){
            // be verbose if asked for
            if( CoreUI._conf.verbosity & CoreUI.C.Verbose.PAGE ){
                console.log( 'pwix:core-ui setting \''+page.name()+'\' as current page' );
            }
            this._vars.page = page;
            this._vars.dep.changed();
        } else {
            this._vars.dep.depend();
        }
        return this._vars.page;
    }

    /**
     * @returns {Boolean} whether the access is allowed to the user for the page
     *  Reactive method
     */
    accessAllowed(){
        this._vars.dep.depend();
        if( this._vars.page ){
            if( !this._vars.page.rolesAccess().length ){
                return true;
            }
            if( pwixRoles.ready()){
                return pwixRoles.userIsInRoles( this._vars.user, this._vars.page.rolesAccess());
            }
        }
        return false;
    }

    /**
     * @returns {Boolean} whether edition is allowed to the user for the page
     *  Reactive method
     */
    editAllowed(){
        this._vars.dep.depend();
        if( pwixRoles.ready()){
            return pwixRoles.userIsInRoles( this._vars.user, this._vars.page.rolesEdit());
        }
        return false;
    }
}
