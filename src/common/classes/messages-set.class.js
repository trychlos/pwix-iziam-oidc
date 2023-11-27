/*
 * /src/common/classes/messages-set.class.js
 *
 * A set of CoreUI.TypedMessage's.
 */

import { Tracker } from 'meteor/tracker';

import { TypedMessage } from './typed-message.class.js';

export class MessagesSet {

    // static data

    static Hierarchy = [
        TypedMessage.Type.ERROR,
        TypedMessage.Type.WARN,
        TypedMessage.Type.INFO,
        TypedMessage.Type.DEBUG,
        TypedMessage.Type.TRACE,
        TypedMessage.Type.LOG
    ];

    // static methods

    // private data

    // the set of izError's
    #set = [];

    // dependency tracking
    #dep = null;

    // private methods

    // returns the last izError of the given type
    _lastByType( type ){
        for( let i=this.#set.length-1 ; i>=0 ; --i ){
            const o = this.#set[i];
            if( o.type() === type ){
                return o;
            }
        }
        return null;
    }

    // returns the last TypedMessage starting from the given type, descending down to a less hierarchical type until something is found
    _lastFromType( type ){
        let msgFound = null;
        let typeFound = false;
        MessagesSet.Hierarchy.every(( t ) => {
            if( !typeFound && t === type ){
                typeFound = true;
            }
            if( typeFound ){
                msgFound = this._lastByType( t );
            }
            return msgFound === null;
        });
        return msgFound;
    }

    // public data

    /**
     * Constructor
     * @returns {MessagesSet}
     */
    constructor(){
        this.#dep = new Tracker.Dependency();
        return this;
    }

    /**
     * @summary Clears the errors set
     */
    clear(){
        this.#set = [];
        this.#dep.changed();
    }

    /**
     * @returns {TypedMessage} last error, last warning or last info message
     *  A reactive data source
     */
    lastError(){
        this.#dep.depend();
        return this._lastFromType( TypedMessage.Type.ERROR );
    }

    /**
     * @summary Adds another error/warning to the errors set
     * @param {Object} o
     */
    push( o ){
        if( o ){
            this.#dep.changed();
            this.#set.push( o );
        }
    }
}
