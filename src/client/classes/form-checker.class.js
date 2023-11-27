/*
 * /src/client/classes/form-checker.class.js
 *
 * This client class manages the checks inside of a form.
 * It is is designed so that the application can directly instanciate it, or may also derive it to build its own derived class.
 * 
 * Notes:
 *  - The constructor should be called from the template onRendered().
 *  - The class relies on '<Collection>.check_<field>( value, data, opts )' functions which return a Promise which resolves to a TypedMessage or null
 *      - value is the current value of the field
 *      - data is an object passed-in when instanciating the FormChecker
 *      - opts is provided by this CoreUI instance with following keys:
 *          - display: if set, whether or not having a UI feedback, defaulting to true
 *          - update: if set, whether or not update the current item (for example, do not update when re-checking all fields)
 *  - The class defines:
 *      - a local 'check_<field>( [opts] })' function for each field which returns a Promise which resolves to a validity boolean for the relevant field
 *      - a local 'check( [opts] )' function which returns a Promise which resolves to a validity boolean for the whole form.
 */

import _ from 'lodash';
const assert = require( 'assert' ).strict; // up to nodejs v16.x

import { Mongo } from 'meteor/mongo';

export class FormChecker {

    // static data

    // static methods

    // private data

    #priv = null;

    // private methods

    // push the message inside the form or call the corresponding function
    //  'err' here should be a TypedMessage
    _pushMessage( err ){
        if( this.#priv.$err ){
            this.#priv.$err.html( err ? ( _.isString( err ) ? err : err.message ) : '&nbsp;' );
        }
        if( this.#priv.errfn ){
            this.#priv.errfn( err );
        }
    }

    // protected methods

    // public data

    /**
     * Constructor
     * @param {Object} o an object with following keys:
     *  - instance: the calling template instance
     *  - collection: the collection object, or any object which holds the check_<field> functions
     *  - fields: a hash which defines the fields to be checked, where:
     *      <key> must be the name of the field in the collection schema
     *      <value> is a hash wih following keys:
     *          - js: the jQuery CSS selector for the INPUT/SELECT field in the DOM
     *          - display: whether the field should be updated to show valid|invalid state, default to true
     *          - val: a function to get the value from the provided item, defaulting to just getting the field value
     *  - $ok: if set, the jQuery object which defines the OK button (to enable/disable it)
     *  - okfn: if set, a function to be called when OK button must enabled / disabled
     *  - $err: if set, the jQuery object which defines the error message place
     *  - errfn: if set, a function to be called to display an error message
     *  - errclear: if set, a function to be called to clear all messages
     *  - data: if set, an object which will be passed to every check_<fn> collection function
     *  - useBootstrapValidationClasses: defaulting to false
     * @returns {FormChecker} a FormChecker object
     */
    constructor( o ){
        const self = this;
        //console.debug( o );
        assert( o, 'expected an Object argument' );
        assert( o.instance instanceof Blaze.TemplateInstance, 'instance is not a Blaze.TemplateInstance');
        //assert( o.collection instanceof Mongo.Collection, 'collection is not a Mongo.Collection' );
        assert( o.collection && _.isObject( o.collection ), 'collection is not provided or not an object' );
        assert( !o.$ok || o.$ok.length > 0, 'when provided, $ok must be set to a jQuery object' );
        assert( !o.okfn || _.isFunction( o.okfn ), 'when provided, okfn must be a function' );
        assert( !o.$err || o.$err.length > 0, 'when provided, $err must be set to a jQuery object' );
        assert( !o.errfn || _.isFunction( o.errfn ), 'when provided, errfn must be a function' );
        assert( o.fields && Object.keys( o.fields ).length > 0, 'fields must be a non-empty object' );

        // keep the provided params
        //  + define a ReactiveVar for this instance which will hold the item validity status
        //  + define a reverse hash js selector to field name
        this.#priv = {
            instance: o.instance,
            collection: o.collection,
            fields: o.fields,
            $ok: o.$ok || null,
            okfn: o.okfn || null,
            $err: o.$err || null,
            errfn: o.errfn || null,
            errclear: o.errclear || null,
            data: o.data || {},
            useBootstrapValidationClasses: false,
            valid: new ReactiveVar( false )
        };
        if( _.isBoolean( o.useBootstrapValidationClasses )){
            this.#priv.useBootstrapValidationClasses = o.useBootstrapValidationClasses;
        }

        // define an autorun which will enable/disable the OK button depending of the validity status
        o.instance.autorun(() => {
            const valid = self.#priv.valid.get();
            if( self.#priv.$ok ){
                self.#priv.$ok.prop( 'disabled', !valid );
            }
            if( self.#priv.okfn ){
                self.#priv.okfn( valid, this.#priv.data );
            }
        });

        // for each field to be checked, define its own check function
        //  this individual check function will always call the corresponding collection function
        //  returns a Promise which resolve to 'valid' status for the field
        // cautious: the collection check_<field>() returns a Promise which resolves to an error message or null
        //  while this check_<field() returns a Promise which resolves to a validity Boolean
        Object.keys( o.fields ).every(( f ) => {
            const fn = 'check_'+f;
            self[fn] = function( opts={} ){
                o.instance.$( o.fields[f].js ).removeClass( 'is-valid is-invalid' );
                const value = o.instance.$( o.fields[f].js ).val() || '';    // input/textarea/select
                return self.#priv.collection[fn]( value, self.#priv.data, opts )
                    .then(( err ) => {
                        const valid = Boolean( err === null );
                        if( err ){
                            this._pushMessage( err );
                        }
                        self.#priv.valid.set( valid );
                        // set valid/invalid bootstrap classes
                        if( o.fields[f].display !== false && self.#priv.useBootstrapValidationClasses === true ){
                            o.instance.$( o.fields[f].js ).addClass( valid ? 'is-valid' : 'is-invalid' );
                        }
                        return Promise.resolve( valid );
                    });
            };
            o.instance.$( o.fields[f].js ).data( 'core-ui-form-checker', f );
            //console.debug( o.fields[f], o.instance.$( o.fields[f].js )[0], o.instance.$( o.fields[f].js ));
            //  o.instance.$( o.fields[f].js )[0].nodeName === 'SELECT'
            return true;
        });

        //console.debug( this );
        return this;
    }

    /**
     * @summary a general function which check each field successively
     * @param {Object} opts an option object with following keys:
     *  - field: if set, indicates a field to not check (as just already validated from an input handler)
     *  - display: if set, then says whether checks have any effect on the display, defaulting to true
     *  - update: if set, then says whether the value found in the form should update the edited object, defaulting to true
     * @returns a Promise which eventually resolves to the global validity status
     */
    check( opts={} ){
        let valid = true;
        let promises = [];
        const self = this;
        Object.keys( self.#priv.fields ).every(( f ) => {
            if( !opts.field || opts.field !== f ){
                promises.push( self[ 'check_'+f ]( opts )
                    .then(( v ) => {
                        valid = valid && v;
                    }));
            }
            return true;
        });
        return Promise.allSettled( promises )
            .then(() => {
                if( opts.display === false ){
                    self.clear();
                }
                return Promise.resolve( valid );
            });
    }

    /**
     * @summary Clears the validity indicators
     */
    clear(){
        const self = this;
        Object.keys( self.#priv.fields ).every(( f ) => {
            self.#priv.instance.$( self.#priv.fields[f].js ).removeClass( 'is-valid is-invalid' );
            return true;
        });
    }

    /**
     * @returns {Object} data
     */
    getData(){
        return this.#priv.data;
    }

    /**
     * @returns {Object} with data from the form
     */
    getForm(){
        const self = this;
        let o = {};
        Object.keys( self.#priv.fields ).every(( f ) => {
            o[f] = self.#priv.instance.$( self.#priv.fields[f].js ).val();
            return true;
        });
        return o;
    }

    /**
     * @summary input event handler
     * @param {Object} event the Meteor event
     * 
     * The principle is that:
     * 1. we check the input field identified by its selector
     *      the check function put itself an error message if not ok
     * 2. if ok, we check all fields (but this one)
     * 
     * @returns {Promise} which eventually resolves to the validity status (of the single current field if false, of the whole form else)
     */
    inputHandler( event ){
        const field = this.#priv.instance.$( event.target ).data( 'core-ui-form-checker' );
        if( this.#priv.errclear ){
            this.#priv.errclear();
        }
        return field ? this[ 'check_'+field ]()
            .then(( valid ) => {
                if( valid ){
                    return this.check({ field: field, update: false });
                } else {
                    return false;
                }
            }) : Promise.resolve( null );
    }

    /**
     * @summary set options to be passed to the form checkers
     * @param {Object} data
     */
    setData( data ){
        //console.debug( 'setData()', data );
        this.#priv.data = data || {};
    }

    /**
     * @summary initialize the form with the given data
     * @param {Object} item
     */
    setForm( item ){
        const self = this;
        Object.keys( self.#priv.fields ).every(( f ) => {
            const value = self.#priv.fields[f].val ? self.#priv.fields[f].val( item ) : item[f];
            console.debug( item, f, value );
            const $elt = self.#priv.instance.$( self.#priv.fields[f].js );
            const tagName = $elt.prop( 'tagName' );
            const eltType = $elt.attr( 'type' );
            if( tagName === 'INPUT' && eltType === 'checkbox' ){
                console.debug( $elt, value );
                $elt.prop( 'checked', value );
            } else {
                $elt.val( value );
            }
            return true;
        });
    }
}
