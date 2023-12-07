/*
 * /src/common/classes/typed-message.class.js
 *
 * An error message.
 */

import _ from 'lodash';

export class TypedMessage {

    // static data

    // message types
    //  when used for logging purposes, the caller is free to choose his own hierarchy
    //  we may suggest to consider that DEBUG = TRACE = LOG
    static C = {
        ERROR: 'ERROR',
        WARNING: 'WARNING',
        INFO : 'INFORMATION',
        DEBUG: 'DEBUG',
        TRACE: 'TRACE',
        LOG: 'LOG'
    };

    // static methods

    // private data

    #emitter = null;
    #type = null;
    #message = null;

    // private methods

    // public data

    /**
     * Constructor
     * @param {Object|String} o an object with following keys:
     *  - emitter {String} the emitter, defaulting to null
     *  - type {String} a key from TypedMessage.C, defaulting to TypedMessage.C.LOG
     *  - message {String} the message itself (mandatory)
     * @returns {TypedMessage}
     */
    constructor( o ){
        if( o.type && !Object.keys( TypedMessage.C ).includes( o.type )){
            throw new SyntaxError( 'TypedMessage() unknown type: '+o.type );
        }
        if( !_.isString( o ) && !o.message ){
            throw new SyntaxError( 'TypedMessage() message is mandatory, not found' );
        }
        this.#emitter = o.emitter || null;
        this.#type = o.type || TypedMessage.C.LOG;
        this.#message = _.isString( o ) ? o : o.message;
        return this;
    }

    /**
     * @returns {String} the emitter
     */
    emitter(){
        return this.#emitter;
    }

    /**
     * @returns {String} the message
     */
    label(){
        return this.#message;
    }

    /**
     * @returns {String} the type
     */
    type(){
        return this.#type;
    }
}
