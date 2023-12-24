// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by iziam.js.
import { name as packageName } from "meteor/pwix:iziam-oidc";
import { name as packageName } from "meteor/pwix:iziam-oidc";

// Write your tests here!
// Here is an example.
Tinytest.add( 'iziam - example', function( test ){
    test.equal( packageName, 'iziam' );
});
