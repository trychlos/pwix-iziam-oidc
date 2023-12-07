/*
 * /src/client/classes/field-check.class.js
 */

import { pwixI18n } from 'meteor/pwix:i18n';

export class FieldCheck {

    // static data

    static Defs = {
        INVALID: {
            class: 'fci-invalid',
            icon: 'fa-xmark',
            title: 'field_check.invalid_title'
        },
        NONE: {
            class: 'fci-none',
            icon: 'fa-ellipsis',
            title: 'field_check.none_title'
        },
        UNCOMPLETE: {
            class: 'fci-uncomplete',
            icon: 'fa-person-digging',
            title: 'field_check.uncomplete_title'
        },
        VALID: {
            class: 'fci-valid',
            icon: 'fa-check',
            title: 'field_check.valid_title'
        }
    };

    // static methods

    // check that the type is known
    static _byType( type ){
        if( !Object.keys( FieldCheck.Defs ).includes( type )){
            console.warn( 'FieldCheck: unknown type', type );
            return null;
        }
        return FieldCheck.Defs[type];
    }

    /**
     * @returns {Array} the list of defined check types
     */
    static Knowns(){
        return Object.keys( FieldCheck.Defs );
    }

    /**
     * @returns {String} the classes associated with this type
     */
    static classes( type ){
        const o = FieldCheck._byType( type );
        return o ? o.class : null;
    }

    /**
     * @returns {String} the name of the icon associated with this type
     */
    static icon( type ){
        const o = FieldCheck._byType( type );
        return o ? o.icon : '';
    }

    /**
     * @returns {String} the title associated with this type
     */
    static title( type ){
        const o = FieldCheck._byType( type );
        return o && o.title ? pwixI18n.label( I18N, o.title ) : '';
    }

    // private data

    //#priv = null;

    // private methods

    // public data

    /*
     * Constructor
     * @param {Object} o the configuration object
     * @returns {FieldCheck} this instance
     */
    /*
    constructor( o ){
        this.#priv = { ...o };
        return this;
    }
    */
}
