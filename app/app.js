var app = angular.module("ShortcutApp", ["ngShortcut"]);

app.run(function(Shortcut){
  
  Shortcut.bind({
    shortcut: 'alt+a',
    handler: function(){
      console.info(arguments);
    }
  });
  
});
