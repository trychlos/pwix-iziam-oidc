/*
 * pwix:core-ui/src/common/js/env-settings.js
 *
 * Setup a copy of the server settings for this running environment, available on both the client and the server.
 * 
 * Note that the Meteor.APP.environmentSettings ReactiveVar is initialized to null at init time.
 * It is then set as the result of an asynchronous method call on client side; the result may thus be delayed.
 * Use of this variable should so be done inside of an autorun() section, and be prepared to get a null value.
 */

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
                settings: Meteor.settings[Meteor.APP.name].environments[env]
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
