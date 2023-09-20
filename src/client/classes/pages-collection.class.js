/*
 * /src/client/classes/pages-set.class.js
 *
 * This class manages the collection of individually defined Page objects.
 * Only one occurrence is needed, managed as a singleton.
 * 
 * This class is designed so that the application can directly instanciate it, or may also derive it to build its own derived class.
 */

import { Page } from './page.class.js';

export class PagesCollection {

    // static data

    static Singleton = null;

    // static methods

    // private data

    _set = [];

    // private methods

    // public data

    /**
     * Constructor
     * @returns {PagesCollection} the singleton instance
     */
    constructor(){
        if( PagesCollection.Singleton ){
            console.log( 'trying to instanciates a new instance of an already existing singleton, returning the singleton' );
            return PagesCollection.Singleton;
        }

        PagesCollection.Singleton = this;

        return this;
    }

    /**
     * @summary add a Page to our collection
     * @param {Page} page
     * @returns {PagesCollection} this
     */
    add( page ){
        assert( page instanceof Page, { msg: 'Page expected, found %o' }, page );
        this._set.push( page );
        return this;
    }

    /**
     * @summary Find a Page by name
     * @param {String} name
     * @returns {Page} the found page, or null
     */
    byName( name ){
        let found = null;
        this.enumerate(( page, name ) => {
            if( page.name() === name ){
                found = page;
            }
            return found === null;
        }, name );
        return found;
    }

    /**
     * @summary Enumerate the pages definitions as initialized by the application
     * @param {Function} cb a callback triggered for each page definition as `cb( page, arg )`
     *  the `cb()` must return true to continue the enumeration, false to stop it
     */
    enumerate( cb, arg=null ){
        this._set.every(( page ) => {
            return cb( page, arg );
        });
    }
}
