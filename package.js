Package.describe({
    name: 'pwix:core-ui',
    version: '0.2.0',
    // Brief, one-line summary of the package.
    summary: 'Bootstrap-based core package for user interfaces',
    // URL to the Git repository containing the source code for this package.
    git: '',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});

Package.onUse( function( api ){
    configure( api );
    api.export([
        'uiCore'
    ]);
    api.mainModule( 'src/client/js/index.js', 'client' );
    api.mainModule( 'src/server/js/index.js', 'server' );
    api.addFiles( 'src/client/stylesheets/core_ui.less', 'client', { isImport: true });
});

Package.onTest( function( api ){
    configure( api );
    api.use( 'tinytest' );
    api.use( 'pwix:core-ui' );
    api.mainModule( 'test/js/index.js' );
});

function configure( api ){
    api.versionsFrom( '2.12' );
    api.use( 'ecmascript' );
    api.use( 'less@4.0.0', 'client' );
    api.use( 'ostrio:flow-router-extra@3.9.0', 'client' );
    api.use( 'pwix:layout@1.2.9', 'client' );
    api.use( 'tmeasday:check-npm-versions@1.0.2', 'server' );
    api.use( 'tracker', 'client' );
}

// NPM dependencies are checked in /src/server/js/check_npms.js
// See also https://guide.meteor.com/writing-atmosphere-packages.html#npm-dependencies
