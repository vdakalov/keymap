keymap
==========

Библиотека для назначения и обработки горячих клавиш. Реализовано на Backbonejs.

Использование

    winterfell.keymap.add({
    
      // СОЧЕТАНИЕ КЛАВИШ
      // можно задать как массив ['shift', 'up']
      // или как строку "shift+up"
      shortcut: 'up',
      
      // ОБРАБОТЧИК
      // принимает событие и сочетание клавиш в виде массива
      handler: function(event, shortcut){
        
      },
      
      // ЭЛЕМЕНТ
      // элемент к которому обработчик будет привязан
      // В данном случае этот элемент "#search". Если
      // он не в фокусе, обработчик не стработает.
      listen: document.querySelector('#search'),
      
      // БЛОКИРОВКА ВСПЛЫТИЯ
      // блокировать ли "всплытие" события?
      block: true
    });
