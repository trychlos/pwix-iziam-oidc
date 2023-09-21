/*
 * /src/client/classes/form-checker.class.js
 *
 * This client class manages the checks inside of a form.
 * 
 * This class is designed so that the application can directly instanciate it, or may also derive it to build its own derived class.
 * 
 * Notes:
 *  - The constructor should be called from the template onRendered().
 *  - The class relies on '<Collection>.check_<field>( value )' functions which return a Promise which resolves to an error message.
 *  - The class defines:
 *      - a local 'check_<field>()' function for each field which returns a Promise which resolves ti a validity boolean
 *      - a local 'check( [field] )' function which returns a Promise which resolves to a validity boolean.
 */

import _ from 'lodash';
const assert = require( 'assert' ).strict;

import { Mongo } from 'meteor/mongo';

export class FormChecker {

    // static data

    // static methods

    // private data

    _data = null;

    // private methods

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
     *  - $ok the jQuery object which defines the OK button (to enable/disable it)
     *  - $err the jQuery object which defines the error message place
     *  - new: whether we are checking a new record, or an already existing one
     *  - useBootstrapValidationClasses: defaulting to true
     * @returns {FormChecker} a FormChecker object
     */
    constructor( o ){
        const self = this;
        //console.debug( o );
        assert( o );
        assert( o.instance instanceof Blaze.TemplateInstance );
        assert( o.collection instanceof Mongo.Collection );
        assert( o.$ok.length > 0 );
        assert( o.$err.length > 0 );
        assert( o.fields && Object.keys( o.fields ).length > 0 );

        // keep the provided params
        //  + define a ReactiveVar for this instance which will hold the item validity status
        //  + define a reverse hash js selector to field name
        this._data = {
            collection: o.collection,
            fields: o.fields,
            $ok: o.$ok,
            $err: o.$err,
            valid: new ReactiveVar( false ),
            jstof: {},
            useBootstrapValidationClasses: true
        };
        if( Object.keys( o ).includes( 'useBootstrapValidationClasses' )){
            this._data.useBootstrapValidationClasses = Boolean( o.useBootstrapValidationClasses );
        }

        // define an autorun which will enable/disable the OK button depending of the validity status
        o.instance.autorun(() => {
            const valid = self._data.valid.get();
            self._data.$ok.prop( 'disabled', !valid );
        });

        // for each field to be checked, define its own check function
        //  this individual check function will always call the corresponding collection function
        //  returns a Promise which resolve to 'valid' status for the field
        Object.keys( o.fields ).every(( f ) => {
            const fn = 'check_'+f;
            self[fn] = function(){
                o.instance.$( o.fields[f].js ).removeClass( 'is-valid is-invalid' );
                const value = o.instance.$( o.fields[f].js ).val() || '';    // input/textarea
                return self._data.collection[fn]( value, { new: self._data.new })
                    .then(( msgerr ) => {
                        //console.debug( f, msgerr );
                        const valid = Boolean( !msgerr || !msgerr.length );
                        self._data.$err.html( msgerr || '&nbsp;' );
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
        self.check = function( opts ){
            let promise = Promise.resolve( true );
            let valid = true;
            Object.keys( o.fields ).every(( f ) => {
                if( !opts.field || opts.field !== f ){
                    promise = promise
                        .then(( res ) => { return res ? self[ 'check_'+f ]() : res; })
                        .then(( res ) => { valid = res; return res; });
                }
                return valid;
            });
            promise = promise
                .then(( valid ) => {
                    self._data.valid.set( valid );
                    if( valid ){
                        o.$err.html( '&nbsp;' );
                    }
                    if( opts.display === false ){
                        o.$err.html( '&nbsp;' );
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
                    return this.check({ field: field });
                }
            });
    }
}
