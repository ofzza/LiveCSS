exports.config = {
    directConnect: true,
    specs: [
        './versioned/**/test.js'
    ],
    multiCapabilities: [
        //{ browserName: 'chrome' },
        { browserName: 'firefox' }
    ]
}