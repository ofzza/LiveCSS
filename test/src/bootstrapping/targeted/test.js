describe('[v@@angularjs-version]: Bootstrap from code to targeted (#angular-app-host) element', function() {

    // Load test
    browser.get('@@livecss-project-server/test/versioned/@@angularjs-version/bootstrapping/targeted/index.html');

    // Assert remote LiveCSS syntax parsed into documents
    it('Loaded and parsed remote syntax', function() {
        var el = element( by.id('lcss-remote-documents-count') );
        expect( el.getText() ).toEqual('2');
    });

    // Assert remote LiveCSS syntax applied
    it('Applied remote syntax', function() {
        var el = element( by.id('lcss-remote-documents-count') );
        expect( el.getCssValue('color') ).toEqual('rgba(255, 0, 0, 1)');
    });

    // Assert local LiveCSS syntax parsed into documents
    it('Loaded and parsed local syntax', function() {
        var el = element( by.id('lcss-local-documents-count') );
        expect( el.getText() ).toEqual('1');
    });

    // Assert local LiveCSS syntax applied
    it('Applied local syntax', function() {
        var el = element( by.id('lcss-local-documents-count') );
        expect( el.getCssValue('color') ).toEqual('rgba(0, 0, 255, 1)');
    });

});