const concatenate = require('broccoli-concat')
  , merge  = require('broccoli-merge-trees')
  , Funnel      = require('broccoli-funnel') //replacement for static pickUp
  , babel         = require('broccoli-babel-transpiler')
  , fs           = require('fs')
  // , alkaliTr    = require("babel-plugin-transform-alkali")


const appHtml = Funnel('./', {
    files   : ['index.html'],
});


function build(tree, outputFileName, prefix) {

  function preprocess (tree) {
    tree = babel(tree, {
      whitelist: [
        'es6.templateLiterals',
        'es6.parameters',
        'es6.arrowFunctions',
        'es6.destructuring',
        'es6.spread',
        'es6.properties.computed',
        'es6.properties.shorthand',
        'es6.blockScoping',
        'es6.constants',
        'es6.modules'
      ],
      sourceMaps: false,
      modules: 'amdStrict',
      moduleId: true,

      getModuleId: function (name) { // this function renames module names, e.g. require('alkali/index') becomes require('alkali')
        if (!prefix)
          return name.replace(/\/index$/g, '');
        else
          return prefix+name.replace(/\/index$/g, '');
      },

      // plugins: [
      //   alkaliTr() //not working
      // ]

    });
    return tree
  }

  var transpiledScripts = preprocess(tree);
  return concatenate(transpiledScripts, {
    outputFile : outputFileName,
    header: '(function(){ \n"use strict";\n',
    footer: '\n})();\n',
    sourceMapConfig: { enabled: false },
  });

}


function collapse(tree, outputFileName) {
  var loader = fs.readFileSync('bower_components/loader.js/lib/loader/loader.js', { encoding: 'utf8' }); // the `require` function
  
  var modulesScripts = Funnel(tree, {
    include: [
      '**', //pickup all files in ./alkali-todo/src folder
    ]
  })

  var nodeMods = Funnel('node_modules', {
    include: [
      'alkali/*.js',
      // 'alkali/extensions/*.js',
      // 'alkali/util/*.js',
    ]
  })
  allMods = merge([modulesScripts,nodeMods]);


  var modules_amd = build(allMods, 'modules.js' );

  var RunApp = 'require(\'index\');';

  amd_scripts = concatenate(modules_amd, {
    outputFile: '/' + outputFileName,
    header: loader + '\n',
    footer: RunApp + '\n',
    sourceMapConfig: { enabled: false },
  });

  return amd_scripts;

}

const appJs = collapse('./src', 'builds/bundle.js');


module.exports = merge([appHtml, appJs ]);

// rm -r dist
// run broccoli build dist