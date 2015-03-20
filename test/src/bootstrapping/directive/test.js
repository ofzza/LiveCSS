describe('[v@@angularjs-version]: Bootstrap via "lcss" directive to default (document.head) element', function() {

    // Load test
    browser.get('@@livecss-project-server/test/versioned/@@angularjs-version/bootstrapping/directive/index.html');

    // Assert remote LiveCSS syntax applied
    it('Applied remote syntax', function() {
        var el = element( by.id('lcss-remote-documents-count') );
        expect( el.getCssValue('color') ).toEqual('rgba(255, 0, 0, 1)');
    });

    // Assert local LiveCSS syntax applied
    it('Applied local syntax', function() {
        var el = element( by.id('lcss-local-documents-count') );
        expect( el.getCssValue('color') ).toEqual('rgba(0, 0, 255, 1)');
    });

});