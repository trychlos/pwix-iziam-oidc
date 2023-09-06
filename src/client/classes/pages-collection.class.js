/*
 * /src/client/classes/pages-set.class.js
 *
 * This class manages the collection of individually defined Page objects.
 * Only one occurrence is needed, managed as a singleton.
 */

export class PagesCollection {

    // static data

    static Singleton = null;
    static Set = [];

    // static methods

    /**
     * @summary Find a Page by name
     * @param {String} name
     * @returns {Page} the found page, or null
     */
    static byName( name ){
        return PagesCollection.Singleton.byName( name );
    }

    // private data

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
     */
    add( page ){
        PagesCollection.Set.push( page );
    }

    /**
     * @summary Find a Page by name
     * @param {String} name
     * @returns {Page} the found page, or null
     */
    byName( name ){
        let found = null;
        PagesCollection.Singleton.Enumerate(( page, name ) => {
            if( page.name() === name ){
                found = page;
                return false;   // stop the enumeration
            }
            return true;
        }, name );
        return found;
    }

    /**
     * @summary Enumerate the pages definitions as initialized by the application
     * @param {Function} cb a callback triggered for each page definition as `cb( page, arg )`
     *  the `cb()` must return true to continue the enumeration, false to stop it
     */
    Enumerate( cb, arg=null ){
        PagesCollection.Set.every(( page ) => {
            return cb( page, arg );
        });
    }
}
