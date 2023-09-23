/*
 * /src/client/classes/form-checker.class.js
 *
 * This client class manages the checks inside of a form.
 * 
 * This class is designed so that the application can directly instanciate it, or may also derive it to build its own derived class.
 * 
 * Notes:
 *  - The constructor should be called from the template onRendered().
 *  - The class relies on '<Collection>.check_<field>( value, opts )' functions which return a Promise which resolves to an error message
 *      - value is the current value of the field
 *      - opts is options object passed-in when instancitaing the FormChecker
 *        may also contain a CoreUI sub-object with following keys:
 *          - display: if set, whether or not having a UI feedback, defaulting to true
 *          - update: if set, whether or not update the current item (for example, do not update when re-checking all fields)
 *  - The class defines:
 *      - a local 'check_<field>()' function for each field which returns a Promise which resolves to a validity boolean
 *      - a local 'check( [opts] )' function which returns a Promise which resolves to a validity boolean.
 */

import _ from 'lodash';
const assert = require( 'assert' ).strict; // up to nodejs v16.x

import { Mongo } from 'meteor/mongo';

export class FormChecker {

    // static data

    // static methods

    // private data

    _data = null;

    // private methods

    _setMsgerr( msgerr ){
        if( this._data.$err ){
            this._data.$err.html( msgerr || '&nbsp;' );
        }
        if( this._data.errfn ){
            this._data.errfn( msgerr || '&nbsp;' );
        }
    }

    // protected methods

    // public data

    /**
     * Constructor
     * @param {Object} o an object with following keys:
     *  - instance: the calling template instance
     *  - collection: the collection object
     *  - fields: a hash which defines the fields to be checked, where:
     *      <key> must be the name of the field in the collection schema
     *      <value> is a hash wih following keys:
     *          - js: the CSS selector for the field in the DOM
     *  - $ok: if set, the jQuery object which defines the OK button (to enable/disable it)
     *  - okfn: if set, a function to be called when OK button must enabled / disabled
     *  - $err: if set, the jQuery object which defines the error message place
     *  - errfn: if set, a function to be called to display an error message
     *  - opts: if set, an object which will be passed to every check_<fn> collection function
     *  - useBootstrapValidationClasses: defaulting to false
     * @returns {FormChecker} a FormChecker object
     */
    constructor( o ){
        const self = this;
        //console.debug( o );
        assert( o, 'expected an Object argument' );
        assert( o.instance instanceof Blaze.TemplateInstance, 'instance is not a Blaze.TemplateInstance');
        assert( o.collection instanceof Mongo.Collection, 'collection is not a Mongo.Collection' );
        assert( !o.$ok || o.$ok.length > 0, 'when provided, $ok must be set to a jQuery object' );
        assert( !o.okfn || _.isFunction( o.okfn ), 'when provided, okfn must be a function' );
        assert( !o.$err || o.$err.length > 0, 'when provided, $err must be set to a jQuery object' );
        assert( !o.errfn || _.isFunction( o.errfn ), 'when provided, errfn must be a function' );
        assert( o.fields && Object.keys( o.fields ).length > 0, 'fields must be a non-empty object' );

        // keep the provided params
        //  + define a ReactiveVar for this instance which will hold the item validity status
        //  + define a reverse hash js selector to field name
        this._data = {
            instance: o.instance,
            collection: o.collection,
            fields: o.fields,
            $ok: o.$ok || null,
            okfn: o.okfn || null,
            $err: o.$err || null,
            errfn: o.errfn || null,
            opts: o.opts || {},
            useBootstrapValidationClasses: false,
            valid: new ReactiveVar( false ),
            jstof: {}
        };
        if( _.isBoolean( o.useBootstrapValidationClasses )){
            this._data.useBootstrapValidationClasses = o.useBootstrapValidationClasses;
        }

        // define an autorun which will enable/disable the OK button depending of the validity status
        o.instance.autorun(() => {
            const valid = self._data.valid.get();
            if( self._data.$ok ){
                self._data.$ok.prop( 'disabled', !valid );
            }
            if( self._data.okfn ){
                self._data.okfn( valid );
            }
        });

        // for each field to be checked, define its own check function
        //  this individual check function will always call the corresponding collection function
        //  returns a Promise which resolve to 'valid' status for the field
        Object.keys( o.fields ).every(( f ) => {
            const fn = 'check_'+f;
            self[fn] = function( opts={} ){
                const local_opts = { ...self._data.opts, CoreUI: { ...opts }};
                o.instance.$( o.fields[f].js ).removeClass( 'is-valid is-invalid' );
                const value = o.instance.$( o.fields[f].js ).val() || '';    // input/textarea
                return self._data.collection[fn]( value, local_opts )
                    .then(( msgerr ) => {
                        //console.debug( f, msgerr );
                        const valid = Boolean( !msgerr || !msgerr.length );
                        this._setMsgerr( msgerr || '&nbsp;' );
                        self._data.valid.set( valid );
                        // set valid/invalid bootstrap classes
                        o.instance.$( o.fields[f].js ).addClass( valid ? 'is-valid' : 'is-invalid' );
                        return Promise.resolve( valid );
                    });
            };
            self._data.jstof[ o.fields[f].js ] = f;
            return true;
        });

        // define a general function which check each field successively
        //  if specified, the field indicates a field to not check (as just already validated from an input handler)
        //  if display is set to false, then the check doesn't have any effect on the display
        self.check = function( opts={} ){
            let promise = Promise.resolve( true );
            let valid = true;
            Object.keys( o.fields ).every(( f ) => {
                if( !opts.field || opts.field !== f ){
                    promise = promise
                        .then(( res ) => { return res ? self[ 'check_'+f ]( opts ) : res; })
                        .then(( res ) => { valid = res; return res; });
                }
                return valid;
            });
            promise = promise
                .then(( valid ) => {
                    self._data.valid.set( valid );
                    if( valid ){
                        this._setMsgerr( '&nbsp;' );
                    } else if( opts.display === false ){
                        this._setMsgerr( '&nbsp;' );
                        Object.keys( o.fields ).every(( f ) => {
                            o.instance.$( o.fields[f].js ).removeClass( 'is-valid is-invalid' );
                            return true;
                        });
                    }
                    return valid;
                });
            return promise;
        };

        //console.debug( this );
        return this;
    }

    /**
     * @summary input event handler
     * @param {Object} event the Meteor event
     * 
     * event.handleObj.type = 'input'
     * event.handleObj.selector = '.js-label'
     * 
     * The principe is that:
     * 1. we check the input field identified by its selector
     *      the check function put itself an error message if not ok
     * 2. if ok, we check all fields (but this one)
     */
    inputHandler( event ){
        const field = this._data.jstof[ event.handleObj.selector ];
        this[ 'check_'+field ]()
            .then(( valid ) => {
                if( valid ){
                    return this.check({ field: field, update: false });
                }
            });
    }
}
