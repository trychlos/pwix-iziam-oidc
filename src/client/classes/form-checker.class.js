/*
 * /src/client/classes/form-checker.class.js
 *
 * This client class manages the checks inside of a form.
 * It is is designed so that the application can directly instanciate it, or may also derive it to build its own derived class.
 * 
 * Notes:
 *  - The constructor should be called from the template onRendered().
 *  - The class relies on '<Object>.check_<field>( value, data, opts )' functions which return a Promise which resolves to a TypedMessage or null
 *      - value is the current value of the field
 *      - data is an object passed-in when instanciating the FormChecker
 *      - opts is provided by this CoreUI instance with following keys:
 *          - display: if set, whether or not having a UI feedback, defaulting to true
 *          - update: if set, whether or not update the current item (for example, do not update when re-checking all fields)
 *  - The class defines:
 *      - a local 'check_<field>( [opts] })' function for each field which returns a Promise which resolves to a validity boolean for the relevant field
 *      - a local 'check( [opts] )' function which returns a Promise which resolves to a validity boolean for the whole form.
 * 
 * Note:
 * - 'collection' should be renamed 'checks' as this only what we care of here
 */

import _ from 'lodash';
const assert = require( 'assert' ).strict; // up to nodejs v16.x

import { ReactiveVar } from 'meteor/reactive-var';

import { TypedMessage } from '../../common/classes/typed-message.class.js';

export class FormChecker {

    // static data

    // static methods

    // private data

    #priv = null;

    // private methods

    // compute the checked type (in the sense of FieldCheck)
    _computeCheck( err, field ){
        let check = 'NONE';
        if( err ){
            switch( err.type()){
                case TypedMessage.C.ERROR:
                    check = 'INVALID';
                    break;
                case TypedMessage.C.WARNING:
                    check = 'UNCOMPLETE';
                    break;
            }
        } else if( this.#priv.fields[field].type ){
            switch( this.#priv.fields[field].type ){
                case 'INFO':
                    check = 'NONE';
                    break;
                default:
                    check = 'VALID';
                    break
            }
        }
        return check;
    }

    // an error message returned by the check function is only considered a validity error if it is of type ERROR
    //  else keep it cool
    _computeValid( err, field ){
        let valid = true;
        if( this.#priv.validfn ){
            valid = this.#priv.validfn( err, field );
        } else {
            valid = !err || err.type() !== TypedMessage.C.ERROR;
        }
        //console.debug( 'err', err, 'field', field, 'valid', valid );
        return valid;
    }

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

    // get the value from the form
    _valueFrom( field ){
        //const     // input/textarea/select
        const $elt = this.#priv.instance.$( this.#priv.fields[field].js );
        const tagName = $elt.prop( 'tagName' );
        const eltType = $elt.attr( 'type' );
        let value;
        if( tagName === 'INPUT' && eltType === 'checkbox' ){
            value = $elt.prop( 'checked' );
        } else {
            value = this.#priv.instance.$( this.#priv.fields[field].js ).val() || '';
        }
        return value;
    }

    // set the value from the item to the form field according to the type of field
    _valueTo( field, item ){
        const value = this.#priv.fields[field].val ? this.#priv.fields[field].val( item ) : item[field];
        //console.debug( item, f, value );
        const $elt = this.#priv.instance.$( this.#priv.fields[field].js );
        const tagName = $elt.prop( 'tagName' );
        const eltType = $elt.attr( 'type' );
        if( tagName === 'INPUT' && eltType === 'checkbox' ){
            $elt.prop( 'checked', value );
        } else {
            $elt.val( value );
        }
    }

    // protected methods

    // public data

    /**
     * Constructor
     * @param {Object} o an object with following keys:
     *  - instance: the calling template instance
     *  - collection: an object which holds the check_<field> functions
     *  - fields: a hash which defines the fields to be checked, where:
     *      <key> must be the name of the field in the collection schema
     *      <value> is a hash wih following keys:
     *          - js: the jQuery CSS selector for the INPUT/SELECT/TEXTAREA field in the DOM
     *          - display: whether the field should be updated to show valid|invalid state, default to true
     *          - val: a function to get the value from the provided item, defaulting to just getting the field value
     *          - post: a function to be called after with the TypedMessage result of the corresponding check_<field>() collection function
     *  - $ok: if set, the jQuery object which defines the OK button (to enable/disable it)
     *  - okfn: if set, a function to be called when OK button must enabled / disabled
     *  - $err: if set, the jQuery object which defines the error message place
     *  - errfn: if set, a function to be called to display an error message
     *  - errclear: if set, a function to be called to clear all messages
     *  - data: if set, an object which will be passed to every check_<fn> collection function
     *  - useBootstrapValidationClasses: defaulting to false
     *  - validfn: if set, a function which computes the validity status of the form depending of the returned value of a check function
     *      default is that only an error message is said invalid
     * @returns {FormChecker} a FormChecker object
     */
    constructor( o ){
        const self = this;
        //console.debug( o );
        assert( o, 'expected an Object argument' );
        assert( o.instance instanceof Blaze.TemplateInstance, 'instance is not a Blaze.TemplateInstance');
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
            validfn: o.validfn || null,
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

        // for each field to be checked, define its own internal check function
        //  this individual check function will always call the corresponding collection function (if exists)
        //  returns a Promise which resolve to 'valid' status for the field
        // Reminder: the collection check_<field>() is expected to return a Promise which resolves to a TypedMessage or null
        //  while this check_<field() returns a Promise which resolves to a validity Boolean
        // + attach ReactiveVar's to the field definition:
        //   - value: the individual value got from the form
        //   - checked: the individual checked type (in the sense of FieldCheck class)
        Object.keys( o.fields ).every(( f ) => {
            const fn = 'check_'+f;
            if( Meteor.isDevelopment ){
                if( !_.isFunction( self.#priv.collection[fn] )){
                    console.warn( '[DEV] \''+fn+'()\' is not a function' );
                }
            }
            o.fields[f].CoreUI = {
                value: new ReactiveVar( null ),
                checked: new ReactiveVar( null )
            };
            self[fn] = function( opts={} ){
                o.instance.$( o.fields[f].js ).removeClass( 'is-valid is-invalid' );
                const value = this._valueFrom( f );
                o.fields[f].CoreUI.value.set( value );
                return Promise.resolve( true )
                    .then(() => {
                        return _.isFunction( self.#priv.collection[fn] ) ? self.#priv.collection[fn]( value, self.#priv.data, opts ) : null;
                    })
                    .then(( err ) => {
                        //console.debug( f, err );
                        const valid = this._computeValid( err, f );
                        self.#priv.valid.set( valid );
                        // manage different err types
                        if( err && opts.msgerr !== false ){
                            this._pushMessage( err );
                        }
                        if( o.fields[f].post ){
                            o.fields[f].post( err );
                        }
                        const checked_type = this._computeCheck( err, f );
                        o.fields[f].CoreUI.checked.set( checked_type );
                        // set valid/invalid bootstrap classes
                        if( o.fields[f].display !== false && self.#priv.useBootstrapValidationClasses === true ){
                            o.instance.$( o.fields[f].js ).addClass( valid ? 'is-valid' : 'is-invalid' );
                        }
                        return valid;
                    });
            };
            o.instance.$( o.fields[f].js ).data( 'form-checker', f );
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
     *  - msgerr: if set, says if error message are accepted, defaulting to true
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
        // also clears the error messages if any
        if( self.#priv.errclear ){
            self.#priv.errclear();
        }
    }

    /**
     * @param {String} field the name of the field we are interested of
     * @returns {String} the corresponding current FieldCheck type
     */
    getFieldCheck( field ){
        if( !this.#priv.fields[field] ){
            console.warn( 'unintialized', field );
        } else {
            return this.#priv.fields[field].CoreUI.checked.get();
        }
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
     * @throws Reject the Promise if the field has not been defined (probably this event is not handled by the form)
     */
    inputHandler( event ){
        const field = this.#priv.instance.$( event.target ).data( 'form-checker' );
        if( this.#priv.errclear ){
            this.#priv.errclear();
        }
        if( !field || !this[ 'check_'+field ] ){
            //return Promise.reject( new Error( 'field is null or not defined in this form' ));
            return Promise.resolve( null );
        } else {
            event.originalEvent['FormChecker'] = { handled: true };
            return this[ 'check_'+field ]()
                .then(( valid ) => {
                    if( valid ){
                        return this.check({ field: field, update: false });
                    } else {
                        return false;
                    }
                });
        }
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
            self._valueTo( f, item );
            return true;
        });
    }
}
