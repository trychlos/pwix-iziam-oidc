/*
 * pwix:core-ui/src/common/js/env-settings.js
 *
 * Setup a copy of the server settings for this running environment, available on both the client and the server.
 * 
 * Note that the Meteor.APP.environmentSettings ReactiveVar is initialized to null at init time.
 * It is then set as the result of an asynchronous method call on client side; the result may thus be delayed.
 * Use of this variable should so be done inside of an autorun() section, and be prepared to get a null value.
 */

import _ from 'lodash';

import { Tracker } from 'meteor/tracker';

if( Meteor.isClient ){
}

if( Meteor.isServer ){
    // define the method to be called from the client
    Meteor.methods({
        // return an object { env, settings } containing the server settings available for the current environment
        'settings.environment'(){
            const env = process.env.APP_ENV || Meteor.settings.runtime.env;
            const o = {
                env: env,
                settings: Meteor.settings[Meteor.APP.name].environments[env] || {}
            };
            return o;
        }
    });
}

// common part 
//
// Setup a copy of the server settings for this running environment, available on both the client and the server.
// 
// Note that the Meteor.APP.environmentSettings ReactiveVar is initialized to null at init time.
// It is then set as the result of an asynchronous method call on client side; the result may thus be delayed.
// Use of this variable should so be done inside of an autorun() section, and be prepared to get a null value.
//
// this is run on both on server and client side
//  so that envSettings may be used to have some environment-dependant configuration parms

Meteor.startup(() => {
    Meteor.call( 'settings.environment', ( err, res ) => {
        if( err ){
            console.error( err );
        } else {
            //console.debug( 'environment settings received', res );
            CoreUI.envSettings.set( res );
        }
    });
});

// let the environment settings override part of the default package configuration provided by the application for this particular environment
// it expects the following hierarchy:
//      "packages": {
//          "pwix:accounts-ui": {               the name of the package
//              "global": "AccountsUI",         the name of the exported global which holds the configure() function
//              "conf": {                       the list of overriden keys for this environment
//                  "passwordLength": 4,            as either a value or a constant
//                  "passwordStrength": {
//                      "constant": "AccountsUI.C.Password.VERYWEAK"
//                  }
//              }
//          }
//      }

Tracker.autorun(() => {
    const res = CoreUI.envSettings.get();
    if( res && res.settings && res.settings.packages ){
        Object.keys( res.settings.packages ).every(( pck ) => {
            if( Object.keys( res.settings.packages[pck] ).includes( 'global' )){
                const global = res.settings.packages[pck].global;
                if( Object.keys( res.settings.packages[pck] ).includes( 'conf' )){
                    let conf = {};
                    Object.keys( res.settings.packages[pck].conf ).every(( key ) => {
                        let val = res.settings.packages[pck].conf[key];
                        if( val ){
                            if( _.isString( val )){
                                conf[key] = val;
                            } else if( _.isNumber( val )){
                                conf[key] = val;
                            } else if( _.isObject( val )){
                                if( val.constant ){
                                    let words = val.constant.split( '.' );
                                    let val2 = Package[pck];
                                    for( let i=0 ; i<words.length ; ++i ){
                                        val2 = val2[words[i]];
                                    }
                                    conf[key] = val2;
                                } else {
                                    console.warn( 'unmanaged key', val );
                                }
                            } else {
                                console.warn( 'unmanaged object', val );
                            }
                        }
                        return true;
                    });
                    //console.debug( 'pck', pck );
                    //console.debug( 'global', global );
                    //console.debug( 'conf', conf );
                    Package[pck][global].configure( conf );
                }
            }
            return true;
        });
    }
});
