<p align="center">
  <a target="_blank" href="http://www.livecss.org">
    <img src="http://www.livecss.org/res/style/img/Logo-50p.png" alt="Live CSS" /> <br/>
    Visit the official site at: www.livecss.org
  </a>
</p>

# <a name="about"></a> About

LiveCSS is an AngularJS module that allows you to use all of the Angular magic inside your CSS files, and a few things extra. If you ever wanted to just be able to write something like:
```css
  margin: 10px;
  width: ((window.width / 2) - 20)px;
```
... in your CSS syntax, LiveCSS will allow you to do just that.

To get started quickly, you can download the simple demo project **"./demo.zip"** and start playing around.


# Table of contents

- [About](#about)
- [Including LiveCSS in your project](#include-in-project)
- [Using LiveCSS](#using-lcss)
  - [Simple application](#simple-app)
  - [Dynamic loading of LiveCSS syntax](#dynamic-load)
- [Advanced LiveCSS syntax and Extensions](#adv-syntax-and-extensions)
  - [LiveCSS Documents](#lcss-documents)
  - [Using Angular directives in your LiveCSS syntax](#directives-in-lcss)
  - [Importing and using extensions](#importing-extensions)
    - [Window extension](#window-extension)
    - [Mouse extension](#mouse-extension)
    - [Math extension](#math-extension)
  - [Optimizing your LiveCSS Documents](#optimizing-lcss)
- [Advanced usage](#adv-usage)
  - [Using LiveCSS with Angular in only a part of your page](#bootstrap-targeting)
  - [Local variables in your LiveCSS syntax](#lcss-variables)


# <a name="include-in-project"></a> Including LiveCSS in your project

Being simply and Angular JS module, all you need to do to get LiveCSS into your application is to load it next to Angular:
```html
  <script src="https://code.angularjs.org/1.4.0-beta.6/angular.js"></script>
  <script src="./livecss.js"></script>
```
... and include it as a dependency of your main application module:
```js
  var app = angular.module('myApp', [ 'LCSS' ]);
```

Once included into your application, LiveCSS will:
- Expose an initially empty object as a **"LCSS" property on the $rootScope** of your application (that will, in turn, be inherited by every other scope) - everything added to the "LCSS" object will be accessible when writing your LiveCSS syntax.
- Introduce a **"LCSS" service** for manipulating LiveCSS functionality from JS code
- Introduce a **"lcss" directive** for manipulating LiveCSS functionality from your HTML templates.


# <a name="using-lcss"></a> Using LiveCSS

#### <a name="simple-app"></a> Simple application

The simplest example of LiveCSS usage is just exposing values on your Angular $scope hierarchy and binding to them both from your HTML and your LiveCSS syntax.
```html
  <input type="color" ng-init=" LCSS.color='#ffffff' " ng-model=" LCSS.color " />
  <style lcss>
    body { background-color: {{ LCSS.color }}; }
  </style>
```
With these few lines of code, we have allowed your normally static CSS syntax to dynamically respond to values in our application's model.
Few notes on this example:
- Notice the usage of the **"LCSS" property** on your $scope to make sure the exposed **"color"** value is accessible across different scopes.
- Notice the standard Angular syntax any Angular developer is familiar with, used inside your CSS syntax.
- While this example, for simplicity sake, uses a value on the model that is simply initialized and managed inside the HTML template, there is nothing stopping you from exposing a much more complex structure of objects, values and/or functions from your JS code and using those inside your CSS syntax.
- To inject LiveCSS syntax into the example we used **"\<style lcss\> ... \</style\>"** syntax - this is only to keep in line with HTML syntax highlighting - most IDEs will know to propperly highlight CSS syntax inside HTML's "\<style\>" tags. While you could instead just write **"\<lcss\> ... \</lcss\>"**, using a "\<style\>" element with an "lcss" attribute will make your code more manageable.

In the previous example we in-lined out LiveCSS syntax directly into our HTML template, but this isn't how you usually use CSS. Much like with 'ordinary' CSS, your LiveCSS syntax can be extracted into an external file resource and included from your HTML template:
```css
  /* Contents of "./mystyle.lcss" file  */
  body { background-color: {{ LCSS.color }}; }
```
```html
  <!-- Include LiveCSS syntax from an outside, "./mystyle.lcss" file
  <input lcss src=" './mystyle.lcss' "
         type="color" ng-init=" LCSS.color='#ffffff' " ng-model=" LCSS.color " />
```
With the **"src" attribute** present, the **"lcss" directive** will load your LiveCSS syntax from the external resource instead of including inlined syntax. Note that:
- The **"src" attribute** will evaluate it's content (so you can use a variable instead of a static string URL value - this is why in the example we're wrapping our URL into additional single-quotes.
- When used to load LiveCSS syntax from an external resource using the **"src" attribute**, the **"lcss" directive** doesn't need its own element and can be used as an attribute on existing elements in your HTML.

#### <a name="dynamic-load"></a> Dynamic loading of LiveCSS syntax

If you need your LiveCSS syntax loaded only at times, say you only need certain styles on certain routes in your application, you can easily do this by managing HTML elements which load your LiveCSS syntax:
```html
  <input type="checkbox" ng-init=" loadLCSS=false " ng-model=" loadLCSS " />
  <lcss ng-if=" loadLCSS " src=" './mystyle.lcss' "></lcss>
```
In this example, the LiveCSS syntax will be loaded and applied when **loadLCSS == true** and unloaded when **loadLCSS == false**.

Of course, you can circumvent using the **"lcss" directive** completely and just load and unload LiveCSS syntax from your JS code to get maximum flexibility. To do this you can inject the **"LCSS" service** and use its **"parse" method**:
```js
  // Inject LCSS service
  app.run([ 'LCSS', function(LCSS) {
  
    // Load remote LiveCss syntax file
    var promiseA = LCSS.parse({
        syntaxUrl: './mystyle.lcss'
    });
    // Act on LiveCSS loaded
    promiseA.then( function(docs) { // "docs" variable will contain an array of LiveCSS Document objects you can use for manipulating your loaded LiveCSS
      // To unload a document use:
      docs[0].$destroy();
    } );

    // Load local LiveCss syntax
    var promiseB = LCSS.parse({
       syntax: ' body { background-color: {{ LCSS.color }}; } '
    });
    // Act on LiveCSS loaded
    promiseB.then( function(docs) { // "docs" variable will contain an array of LiveCSS Document objects you can use for manipulating your loaded LiveCSS
      // To unload a document use:
      docs[0].$destroy();
    } );

  } ]);
```
Why promises generated by calling **LCSS.parse** resolve to an **array of LiveCSS Document objects** and not a single object will become apparent ...

Apart from **"syntaxUrl"** and **"syntax" parameters** the **"parse" method** will take any other passed parameters and expose them on created **LiveCSS Document objects** - this too will be shown to be useful in later sections ... 


# <a name="adv-syntax-and-extensions"></a> Advanced LiveCSS syntax and Extensions

In your LiveCSS syntax, besides using CSS selectors and properties, and besides using Angular bindings, you can also use Angular Directives. Before we get into those, let just introduce the concept of splitting up your LiveCSS syntax into multiple documents ...

#### <a name="lcss-documents"></a> LiveCSS Documents

By using the **"\<style\> ... \</style\>" element**, as a wrapper for parts of your LiveCSS syntax, you're splitting up your syntax into separate documents. Remember earlier when **"LCSS.parse"** returned an array of documents and not just a single document object - this is why.

Wrapping parts of your LiveCSS syntax as separate documents allows not only for better organization on your code, but also introduces a place to inject additional parameters for each document:
```html
  <style id="my_lcss_document">
    background-color: {{ LCSS.color }};
  </style>
```
These additional parameters (incidently, these are the same parameters that can alternatively be passed to the **"LCSS.parse" method**) are used for importing extensions and for execution optimizations, both of which will be discussed in a later section ...

#### <a name="directives-in-lcss"></a> Using Angular directives in your LiveCSS syntax

Usage of angular directives in your LiveCSS syntax is no different than using them in your HTML templates:
```html
  <!-- Let user select a number of elements -->
  <input lcss src=" './mystylewithdirectives.lcss' "
         type="range" min="0" max="32" ng-init="LCSS.count=0 " ng-model=" LCSS.count " />
  <!-- Generate selected elements (assuming the existence of LCSS.generateArrayOfLength(N) function which created an array with N elements) -->
  <div>
    <div class="el" ng-init=" LCSS.elState = [ ] " ng-repeat=" el in LCSS.generateArrayOfLength( LCSS.count ) ">
      <!-- For each created element, manage true/false value -->
      <input type="checkbox" ng-model=" LCSS.elState[ $index ] " />
    </div>
  </div>
```
```html
  <style> /* Contents of "./mystylewithdirectives.lcss" file  */
  
    /* Generate style for selected elements (assuming the existance of LCSS.generateArrayOfLength(N) function which created an array */
    <repeat ng-repeat=" el in LCSS.generateArrayOfLength( LCSS.count ) ">
    
      /* Style Nth element */
      .el:nth-child( {{ $index + 1 }} ) {
        /* Set width proportional to element's index */
        width: {{ $index * 4 }}px;
        /* Set background color based on if 'element's state' */
        background-color: {{ LCSS.elState[ $index ] ? '#000000' : '#AAAAAA' }};
      }
      
    </repeat>
    
  </style>
```
In this example we have generated a user-selected number of elements and have styled each according to it's relative index and an additional state information.

#### <a name="importing-extensions"></a> Importing and using extensions

LiveCSS is an extensible module. You can write your own extensions, which will be covered in a later section, or you can simply use extensions already included with LiveCSS.

To import an extensions into your LiveCSS Document use the **"import" attribute**, passing it an array object with names of extensions you want included:
```html
  <style import=" [ 'Window' ] ">
    /* ... now you can use the "Window" extension ni your syntax */
  </style>
```

Extensions built into LiveCSS are:

###### <a name="window-extension"></a> Window extension

The **"Window" extension** exposes a **"Window" object** inside your **LiveCSS Document**. The structure of the object is as follows:
```js
  Window = {
    size: {
      /*  This value will always reflect the width of the window */
      width: typeof number,
      /*  This value will always reflect the height of the window */
      height: typeof number
    }
  }
```

Now you can write truly responsive layouts, mixing fixed values like margin and padding with dynamic ones, like:
```html
  <style import=" [ 'Window' ] ">
    .container {
      margin: 10px;
      width: {{ Window.size.width - 20 }}px;        // Full window width, minus the margin 
    }
    .left-panel {
      margin: 10px;
      width: 200px;                                 // Fixed width element
    }
    .right-panel {
      margin: 10px 10px 10px 0px;
      width: {{ Window.size.width - 200 - 50 }}px;  // Remainer of unused space, minding the margins
    }
  </style>
```


###### <a name="mouse-extension"></a> Mouse extension

The **"Mouse" extension** exposes a **"Mouse" object** inside your **LiveCSS Document**. The structure of the object is as follows:
```js
  Window = {
    absolute: {
      /*  This value will always reflect the absolute X position of the mouse pointer in your window */
      x: typeof number,
      /*  This value will always reflect the absolute Y position of the mouse pointer in your window */
      y: typeof number
    },
    relative: {
      /*  This value will always reflect the relative [0 - 1] X position of the mouse pointer in your window */
      x: typeof number,
      /*  This value will always reflect the relative [0 - 1] Y position of the mouse pointer in your window */
      y: typeof number
    }
  }
```

This allows you to position and style your elements dynamically based on mouse position:
```html
  <style import=" [ 'Mouse' ] ">
    .header { height: 80px; };
    .content { 
      opacity: {{ Mouse.position.absolute <= 80 ? 0.5 : 1 }};     // Will make content transparent if mouse positioned over header
    };
    .mouse-companion {
      position: absolute;
      left: {{ Mouse.position.absolute.x + 10 }}px;               // Will keep this element next to the mouse pointer at all times
      top:  {{ Mouse.position.absolute.y + 10 }}px;
    }
  </style>
```


###### <a name="math-extension"></a> Math extension

The **"Math" extension** exposes the **JS "Math" object** inside your **LiveCSS Document**. The Math object is useful for it's round, floor, ceil, sin, cos, etc. functions when building more complex layouts:

```html
  <style import=" [ 'Mouse' ] ">
    .mouse-companion {
      position: absolute;
      /* Similar to previous example, this will keep the element next to the mouse pointer, but introduces an additional offset based on SIN/COS of mouse relative position. This will result in the element circling around the point next to the mouse pointer as you move your mouse ... */
      left: {{ Mouse.position.absolute.x + 10 + ( 20 * Math.cos( 20 * Math.PI * Mouse.position.relative.x ) ) }}px;
      top:  {{ Mouse.position.absolute.y + 10 + ( 20 * Math.sin( 20 * Math.PI * Mouse.position.relative.y ) ) }}px;
    }
  </style>
```

Unlike other extensions, the Math extension doesn't have to be explicitly imported.


#### <a name="optimizing-lcss"></a> Optimizing your LiveCSS Documents

When using extensions or directly bound, dynamic values in your LiveCSS syntax, the syntax will be recompiled every time any change is detected. While this is fine for one-shot usages where all you need is to establish your layout once, or every once in a while, if you want to have quicky iterating styling (for example do animations), for performance sake you might not want all your documents to compile on every possible, detected change.

You can control when a LiveCSS document gets re-compiled by introducing an additional **"watch" parameter**, making sure the document only gets re-compiled when a value that is being used changes:
```html
  <style import=" ['Window'] "
         watch=" [ Window.size ] ">
    /*... will only recompile when Window.size has changed  */
  </style>
  <style import=" ['Mouse'] "
         watch=" [ Mouse.position ] ">
    /*... will only recompile when Mouse.position has changed  */
  </style>
  <style import=" ['Mouse'] "
         watch=" [ Mouse.position.absolute.x ] ">
    /*... will only recompile when Mouse.position.absolute.x has changed  */
  </style>
  <style import=" ['Window', 'Mouse'] "
         watch=" [ Window.size, Mouse.position.absolute.x ] ">
    /*... will only recompile when Window.size or Mouse.position.absolute.x have changed  */
  </style>
```

The **"watch" parameter** takes a custom object expression that gets evaluated on every change and only triggers re-compilation if the expression's value has changed - if you've worked with Angular's $scope.$watch implementation, this should be familiar.


# <a name="adv-usage"></a> Advanced usage

#### <a name="bootstrap-targeting"></a> Using LiveCSS with Angular in only a part of your page

If you're bootstrapping your Angular application (either manually or via ng-app tag), not to the document object (\<html\> element), but to a child element, you need to notify LiveCSS of this. To do this, use the following code in the config stage of Angular's bootstraping lifecycle:
```js
  app.config(['LCSSProvider', function(LCSSProvider) {
      // Get DOM element to which Angular is bootstrapped (alternatively, any child of this element will do)
      var ngHostEl = document.getElementById('angular-app-host');
      // Target this host element as LiveCSS host
      LCSSProvider.target( ngHostEl );
  }]);
```

#### <a name="lcss-variables"></a> Local variables in your LiveCSS syntax

If you have a longer calculation you need to do, or need a values stored so you can use them in multiple places in your syntax, you can do this inside CSS comments:
```html
<style import=" ['Mouse'] "
       watch=" [ Mouse.position ] ">

    /* Calculate position ... */
    /* var position = { x: 0, y: 0} */
    /* position.x = Mouse.position.absolute.x */
    /* position.y = Mouse.position.absolute.y */

    /* Calculate circular offset ... */
    /* position.x += 20 * Math.cos( 20 * Math.PI * (Mouse.position.relative.x + Mouse.position.relative.y) ) */
    /* position.y += 20 * Math.sin( 20 * Math.PI * (Mouse.position.relative.x + Mouse.position.relative.y) ) */

    /* Round values */
    /* position.x = Math.round( position.x ) */
    /* position.y = Math.round( position.y ) */

    .element {
        position: absolute;
        left: {{ position.x }}px;
        top:  {{ position.y }}px;
    }

</style>
```


# Compatibility

LiveCSS is compatible with AngularJS versions >= 1.2.x


# Licensing and Contributions

LiveCSS is published under MIT license and is completely free to use. If you wish to contribute to the project make a Fork and submit Pull Requests with suggested updates/changes.

Any contributions, feedback or just notices of successful implementation will be greatly appreciated.