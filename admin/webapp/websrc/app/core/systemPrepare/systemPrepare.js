(function(global) {
  var counter = 0, timeout;
  var systemPrepare = document.querySelector('.system-prepare');
  var progressBar = document.querySelector('.system-prepare-progress');
  var body = document.querySelector('body');

  if (!systemPrepare) return;

  body.style.overflow = 'hidden';

  global.appBootstrap = function() {
    console.log("loading...");
    setTimeout(function(){
      body.style.overflow = '';
      systemPrepare.addEventListener('transitionend', function() {
        systemPrepare.className = 'system-prepare-hidden';
      });
      systemPrepare.className += 'system-prepare-hidden-add system-prepare-hidden-add-active';
      progressBar.className = '';
    }, 1000);
  };
})(window);
