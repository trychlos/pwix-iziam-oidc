/*
 * /src/client/classes/field-type.class.js
 */

import { pwixI18n } from 'meteor/pwix:i18n';

export class FieldType {

    // static data

    static Defs = {
        INFO: {
            class: 'fti-info',
            icon: 'fa-info',
            title: 'field_type.info_title'
        },
        SAVE: {
            class: 'fti-save',
            icon: 'fa-square-pen',
            title: 'field_type.save_title'
        },
        WORK: {
            class: 'fti-work',
            icon: 'fa-person-digging',
            title: 'field_type.work_title'
        }
    };

    // static methods

    // check that the type is known
    static _byType( type ){
        if( !Object.keys( FieldType.Defs ).includes( type )){
            console.warn( 'FieldType: unknown type', type );
            return null;
        }
        return FieldType.Defs[type];
    }

    /**
     * @returns {String} the classes associated with this type
     */
    static classes( type ){
        const o = FieldType._byType( type );
        return o ? o.class : null;
    }

    /**
     * @returns {String} the name of the icon associated with this type
     */
    static icon( type ){
        const o = FieldType._byType( type );
        return o ? o.icon : '';
    }

    /**
     * @returns {String} the title associated with this type
     */
    static title( type ){
        const o = FieldType._byType( type );
        return o && o.title ? pwixI18n.label( I18N, o.title ) : '';
    }

    // private data

    //#priv = null;

    // private methods

    // public data

    /*
     * Constructor
     * @param {Object} o the configuration object
     * @returns {FieldType} this instance
     */
    /*
    constructor( o ){
        this.#priv = { ...o };
        return this;
    }
    */
}
